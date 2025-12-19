const ThreadDetail = require("../../Domains/threads/entities/ThreadDetail")
const CommentDetail = require("../../Domains/comments/entities/CommentDetail")
const ReplyDetail = require("../../Domains/replies/entities/ReplyDetail")

class GetThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository, likeRepository }) {
    this._threadRepository = threadRepository
    this._commentRepository = commentRepository
    this._replyRepository = replyRepository
    this._likeRepository = likeRepository
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload

    await this._threadRepository.verifyThreadAvailability(threadId)

    const thread = await this._threadRepository.getThreadById(threadId)
    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId
    )

    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(
          comment.id
        )
        const formattedReplies = replies.map(
          (reply) =>
            new ReplyDetail({
              id: reply.id,
              username: reply.username,
              date: reply.date,
              content: reply.is_deleted
                ? "**balasan telah dihapus**"
                : reply.content,
            })
        )

        const likeCount = await this._likeRepository.getLikeCountByCommentId(comment.id)

        return new CommentDetail({
          id: comment.id,
          username: comment.username,
          date: comment.date,
          content: comment.is_deleted
            ? "**komentar telah dihapus**"
            : comment.content,
          likeCount,
          replies: formattedReplies,
        })
      })
    )

    return new ThreadDetail({
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date,
      username: thread.username,
      comments: commentsWithReplies,
    })
  }
}

module.exports = GetThreadUseCase
