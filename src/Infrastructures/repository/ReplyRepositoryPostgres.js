const ReplyRepository = require("../../Domains/replies/ReplyRepository")
const AddedReply = require("../../Domains/replies/entities/AddedReply")
const NotFoundError = require("../../Commons/exceptions/NotFoundError")
const AuthorizationError = require("../../Commons/exceptions/AuthorizationError")

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super()
    this._pool = pool
    this._idGenerator = idGenerator
  }

  async addReply(addReply) {
    const { content, commentId, owner } = addReply
    const id = `reply-${this._idGenerator()}`
    const date = new Date().toISOString()

    const query = {
      text: "INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner",
      values: [id, content, date, commentId, owner, false],
    }

    const result = await this._pool.query(query)

    return new AddedReply({ ...result.rows[0] })
  }

  async verifyReplyAvailability(replyId) {
    const query = {
      text: "SELECT id FROM replies WHERE id = $1",
      values: [replyId],
    }

    const result = await this._pool.query(query)

    if (!result.rowCount) {
      throw new NotFoundError("reply tidak ditemukan")
    }
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: "SELECT owner FROM replies WHERE id = $1",
      values: [replyId],
    }

    const result = await this._pool.query(query)

    const reply = result.rows[0]

    if (reply.owner !== owner) {
      throw new AuthorizationError("anda tidak berhak mengakses resource ini")
    }
  }

  async deleteReply(replyId) {
    const query = {
      text: "UPDATE replies SET is_deleted = true WHERE id = $1",
      values: [replyId],
    }

    await this._pool.query(query)
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: `SELECT replies.id, users.username, replies.date, replies.content, replies.is_deleted
             FROM replies
             LEFT JOIN users ON replies.owner = users.id
             WHERE replies.comment_id = $1
             ORDER BY replies.date ASC`,
      values: [commentId],
    }

    const result = await this._pool.query(query)

    return result.rows
  }
}

module.exports = ReplyRepositoryPostgres
