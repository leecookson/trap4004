
module.exports = exports = userToFileName;

function userToFileName(userName) {
  if (!userName || typeof userName != 'string') return '';

  return userName.toUpperCase() + userName.substring(1);

}


