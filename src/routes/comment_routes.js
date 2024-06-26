import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comments_controller.js"
import {verifyJWT} from "../middlewares/auth_middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/:videoId").get(getVideoComments).post(addComment);
// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);
router.route("/delete/:commentId").delete(deleteComment);
router.route("/update/:commentId").patch(updateComment);

export default router