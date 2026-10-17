import express from "express";
import multer from "multer";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";
import { extractPdfText } from "../utils/pdf.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

//every route below belongs to the logged in account
router.use(requireAuth);

const MAX_PDF_BYTES = 10 * 1024 * 1024; //10 MB
const MAX_DOCS_PER_THREAD = 3;

//kept in memory - the text is what we store, the file itself is not
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: MAX_PDF_BYTES},
    fileFilter: (req, file, cb) => {
        if(file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are supported"));
        }
        cb(null, true);
    }
});

//documents without their (large) text, for listing in the UI
const documentSummary = (doc) => ({
    id: doc._id,
    name: doc.name,
    pages: doc.pages,
    truncated: doc.truncated
});

//Get all threads of the logged in user
router.get("/thread", async(req, res) => {
    try {
        const threads = await Thread.find({user: req.user._id})
            .sort({updatedAt: -1})
            .select("threadId title updatedAt");
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        const thread = await Thread.findOne({threadId, user: req.user._id});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.json({
            messages: thread.messages,
            documents: thread.documents.map(documentSummary)
        });
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({threadId, user: req.user._id});

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});

//Attach a PDF to a thread - the text is extracted now and replayed on every later question
router.post("/thread/:threadId/document", upload.single("file"), async (req, res) => {
    const {threadId} = req.params;

    if(!req.file) {
        return res.status(400).json({error: "No PDF was uploaded"});
    }

    try {
        const {text, pages, truncated} = await extractPdfText(req.file.buffer);

        let thread = await Thread.findOne({threadId, user: req.user._id});

        if(!thread) {
            //uploading before the first message starts the thread off
            thread = new Thread({
                user: req.user._id,
                threadId,
                title: req.file.originalname,
                messages: [],
                documents: []
            });
        }

        if(thread.documents.length >= MAX_DOCS_PER_THREAD) {
            return res.status(400).json({error: `You can attach at most ${MAX_DOCS_PER_THREAD} PDFs to one chat`});
        }

        thread.documents.push({name: req.file.originalname, text, pages, truncated});
        thread.updatedAt = new Date();
        await thread.save();

        res.status(201).json({
            document: documentSummary(thread.documents[thread.documents.length - 1]),
            documents: thread.documents.map(documentSummary)
        });
    } catch(err) {
        console.log(err);
        res.status(400).json({error: err.message || "Failed to read the PDF"});
    }
});

router.delete("/thread/:threadId/document/:documentId", async (req, res) => {
    const {threadId, documentId} = req.params;

    try {
        const thread = await Thread.findOne({threadId, user: req.user._id});

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        const doc = thread.documents.id(documentId);

        if(!doc) {
            return res.status(404).json({error: "Document not found"});
        }

        doc.deleteOne();
        await thread.save();

        res.json({documents: thread.documents.map(documentSummary)});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to remove the document"});
    }
});

router.post("/chat", async(req, res) => {
    const { threadId, message } = req.body;

    if(!threadId || !message) {
        return res.status(400).json({error: "missing required fields"});
    }

    try {
        let thread = await Thread.findOne({threadId, user: req.user._id});

        if(!thread) {
            //create a new thread in Db
            thread = new Thread({
                user: req.user._id,
                threadId,
                title: message.length > 60 ? `${message.slice(0, 60)}...` : message,
                messages: []
            });
        } else if(!thread.messages.length) {
            //thread was started by a PDF upload - name it after the first question
            thread.title = message.length > 60 ? `${message.slice(0, 60)}...` : message;
        }

        //everything said so far, replayed to the model so it remembers the conversation
        const history = thread.messages.map(({role, content}) => ({role, content}));
        const documents = thread.documents.map(({name, text}) => ({name, text}));

        const assistantReply = await getOpenAIAPIResponse(message, history, documents);

        //only persist once the reply succeeded, so a failed call never leaves a dangling question
        thread.messages.push({role: "user", content: message});
        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply: assistantReply});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: err.message || "something went wrong"});
    }
});

//multer rejections (file too large, wrong type) arrive here as errors
router.use((err, req, res, next) => {
    if(err?.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({error: "That PDF is larger than 10 MB"});
    }
    if(err) {
        return res.status(400).json({error: err.message || "Upload failed"});
    }
    next();
});

export default router;
