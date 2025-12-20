const routes = (handler) => [
  {
    method: 'PUT',
    path: '/threads/{threadId}/comments/{id}/likes',
    handler: handler.putLikeHandler,
    options: {
      auth: 'forumapi_jwt',
      plugins: {
        'hapi-rate-limit': {
          enabled: true,
        },
      },
    },
  },
];

module.exports = routes;
