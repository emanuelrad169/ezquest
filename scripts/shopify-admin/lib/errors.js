function formatGraphQLErrors(errors = []) {
  return errors
    .map((error) => {
      const pathText = error.path ? ` (${error.path.join(" > ")})` : "";
      return `- ${error.message}${pathText}`;
    })
    .join("\n");
}

function formatUserErrors(errors = []) {
  return errors
    .map((error) => {
      const fieldText = error.field && error.field.length > 0 ? ` [${error.field.join(".")}]` : "";
      return `- ${error.message}${fieldText}`;
    })
    .join("\n");
}

function isTransientStatus(status) {
  return [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
}

module.exports = {
  formatGraphQLErrors,
  formatUserErrors,
  isTransientStatus
};
