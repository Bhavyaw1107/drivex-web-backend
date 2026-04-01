exports.detectConflict = (clientVersion, serverVersion) => {
  return clientVersion < serverVersion;
};
