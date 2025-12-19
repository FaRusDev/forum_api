const CommentRepository = require("../../Domains/comments/CommentRepository")
const AddedComment = require("../../Domains/comments/entities/AddedComment")
const NotFoundError = require("../../Commons/exceptions/NotFoundError")
const AuthorizationError = require("../../Commons/exceptions/AuthorizationError")

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super()
    this._pool = pool
    this._idGenerator = idGenerator
  }

  async addComment(addComment) {
    const { content, threadId, owner } = addComment
    const id = `comment-${this._idGenerator()}`
    const date = new Date().toISOString()

    const query = {
      text: "INSERT INTO comments VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner",
      values: [id, content, date, threadId, owner, false],
    }

    const result = await this._pool.query(query)

    return new AddedComment({ ...result.rows[0] })
  }

  async verifyCommentAvailability(commentId) {
    const query = {
      text: "SELECT id FROM comments WHERE id = $1",
      values: [commentId],
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new NotFoundError("comment tidak ditemukan")
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: "SELECT owner FROM comments WHERE id = $1",
      values: [commentId],
    }

    const result = await this._pool.query(query)

    const comment = result.rows[0]

    if (comment.owner !== owner) {
      throw new AuthorizationError("anda tidak berhak mengakses resource ini")
    }
  }

  async deleteComment(commentId) {
    const query = {
      text: "UPDATE comments SET is_deleted = true WHERE id = $1",
      values: [commentId],
    }

    await this._pool.query(query)
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, users.username, comments.date, comments.content, comments.is_deleted
             FROM comments
             LEFT JOIN users ON comments.owner = users.id
             WHERE comments.thread_id = $1
             ORDER BY comments.date ASC`,
      values: [threadId],
    }

    const result = await this._pool.query(query)

    return result.rows
  }
}

module.exports = CommentRepositoryPostgres
