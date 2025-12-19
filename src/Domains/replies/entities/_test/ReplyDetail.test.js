const ReplyDetail = require("../ReplyDetail")

describe("a ReplyDetail entities", () => {
  it("should throw error when payload did not contain needed property", () => {
    // Arrange
    const payload = {
      id: "reply-123",
      content: "A Reply",
      date: "2021-08-08T07:59:18.982Z",
    }

    // Action and Assert
    expect(() => new ReplyDetail(payload)).toThrowError(
      "REPLY_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY"
    )
  })

  it("should throw error when payload did not meet data type specification", () => {
    // Arrange
    const payload = {
      id: "reply-123",
      content: "A Reply",
      date: "2021-08-08T07:59:18.982Z",
      username: 123,
    }

    // Action and Assert
    expect(() => new ReplyDetail(payload)).toThrowError(
      "REPLY_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION"
    )
  })

  it("should create replyDetail object correctly", () => {
    // Arrange
    const payload = {
      id: "reply-123",
      content: "A Reply",
      date: "2021-08-08T07:59:18.982Z",
      username: "dicoding",
    }

    // Action
    const { id, content, date, username } = new ReplyDetail(payload)

    // Assert
    expect(id).toEqual(payload.id)
    expect(content).toEqual(payload.content)
    expect(date).toEqual(payload.date)
    expect(username).toEqual(payload.username)
  })
})
