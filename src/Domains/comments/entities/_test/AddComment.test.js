const AddComment = require("../AddComment")

describe("an AddComment entities", () => {
  it("should throw error when payload did not contain needed property", () => {
    // Arrange
    const payload = {
      content: "A Comment",
      threadId: "thread-123",
    }

    // Action and Assert
    expect(() => new AddComment(payload)).toThrowError(
      "ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY"
    )
  })

  it("should throw error when payload did not meet data type specification", () => {
    // Arrange
    const payload = {
      content: 123,
      threadId: "thread-123",
      owner: "user-123",
    }

    // Action and Assert
    expect(() => new AddComment(payload)).toThrowError(
      "ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION"
    )
  })

  it("should create addComment object correctly", () => {
    // Arrange
    const payload = {
      content: "A Comment",
      threadId: "thread-123",
      owner: "user-123",
    }

    // Action
    const { content, threadId, owner } = new AddComment(payload)

    // Assert
    expect(content).toEqual(payload.content)
    expect(threadId).toEqual(payload.threadId)
    expect(owner).toEqual(payload.owner)
  })
})
