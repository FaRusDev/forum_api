const ThreadDetail = require("../ThreadDetail")

describe("a ThreadDetail entities", () => {
  it("should throw error when payload did not contain needed property", () => {
    // Arrange
    const payload = {
      id: "thread-123",
      title: "A Thread",
      body: "A Thread Body",
      date: "2021-08-08T07:19:09.775Z",
    }

    // Action and Assert
    expect(() => new ThreadDetail(payload)).toThrowError(
      "THREAD_DETAIL.NOT_CONTAIN_NEEDED_PROPERTY"
    )
  })

  it("should throw error when payload did not meet data type specification", () => {
    // Arrange
    const payload = {
      id: "thread-123",
      title: "A Thread",
      body: "A Thread Body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
      comments: "not array",
    }

    // Action and Assert
    expect(() => new ThreadDetail(payload)).toThrowError(
      "THREAD_DETAIL.NOT_MEET_DATA_TYPE_SPECIFICATION"
    )
  })

  it("should create threadDetail object correctly", () => {
    // Arrange
    const payload = {
      id: "thread-123",
      title: "A Thread",
      body: "A Thread Body",
      date: "2021-08-08T07:19:09.775Z",
      username: "dicoding",
      comments: [],
    }

    // Action
    const threadDetail = new ThreadDetail(payload)

    // Assert
    expect(threadDetail.id).toEqual(payload.id)
    expect(threadDetail.title).toEqual(payload.title)
    expect(threadDetail.body).toEqual(payload.body)
    expect(threadDetail.date).toEqual(payload.date)
    expect(threadDetail.username).toEqual(payload.username)
    expect(threadDetail.comments).toEqual(payload.comments)
  })
})
