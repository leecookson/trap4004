function FindProxyForURL(url, host) {
  if (shExpMatch(host, "*.hobbitmobile.com")) {
    return "PROXY kom.trap4004.com:4004; DIRECT;";
  } else {
    return "DIRECT;";
  }
}
