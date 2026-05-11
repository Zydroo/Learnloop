const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * @desc    Get all comments for a specific lesson
 * @route   GET /api/comments/lesson/:lessonId
 * @access  Public
 */
const getLessonComments = async (req, res) => {
    const { lessonId } = req.params;

    try {
        const [comments] = await db.query(`
            SELECT c.id, c.content, c.created_at, c.parent_comment_id, u.first_name, u.last_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.lesson_id = ?
            ORDER BY c.created_at ASC
        `, [lessonId]);

        // Organize comments into a tree structure for replies
        const commentMap = {};
        const roots = [];

        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment.id] = comment;
            if (comment.parent_comment_id) {
                if (commentMap[comment.parent_comment_id]) {
                    commentMap[comment.parent_comment_id].replies.push(comment);
                }
            } else {
                roots.push(comment);
            }
        });

        res.status(200).json(roots);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error fetching comments' });
    }
};

/**
 * @desc    Post a comment or reply to a lesson
 * @route   POST /api/comments/lesson/:lessonId
 * @access  Private
 */
const postComment = async (req, res) => {
    const { lessonId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    try {
        const id = uuidv4();
        await db.query(`
            INSERT INTO comments (id, lesson_id, user_id, content, parent_comment_id)
            VALUES (?, ?, ?, ?, ?)
        `, [id, lessonId, userId, content, parentCommentId || null]);

        res.status(201).json({ message: 'Comment posted successfully', id });
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ message: 'Server error posting comment' });
    }
};

/**
 * @desc    Delete a comment (only by author or admin)
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const deleteComment = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const [comment] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
        if (comment.length === 0) return res.status(404).json({ message: 'Comment not found' });

        if (comment[0].user_id !== userId && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await db.query('DELETE FROM comments WHERE id = ?', [id]);
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error deleting comment' });
    }
};

module.exports = {
    getLessonComments,
    postComment,
    deleteComment
};
