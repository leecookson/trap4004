
module.exports = exports = userToFileName;

function userToFileName(userName) {
  if (!userName || typeof userName != 'string') return '';

  return userName[0].toUpperCase() + userName.substring(1);

}


