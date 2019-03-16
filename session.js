function sessionId(session) {
  return session.id;
}

function userId(session) {
  return session.user.id;
}

module.exports = {
  sessionId,
  userId,
};