// When running locally will occupy the 0.0.0.0 hostname space but when deployed inside
// of docker this endpoint is not exposed so it is only on the Docker instances internal network
// so no additional security is needed on the endpoint directly. Auth is done however by the express
// middleware prior to leaving the node-side of the application so that is good enough >:)
const PYTHON_API = "http://0.0.0.0:8888";
const DocumentProcessor = {
  status: async function () {
    return await fetch(`${PYTHON_API}`)
      .then((res) => res.ok)
      .catch((e) => false);
  },
  acceptedFileTypes: async function () {
    return await fetch(`${PYTHON_API}/accepts`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not reach");
        return res.json();
      })
      .then((res) => res)
      .catch(() => null);
  },
  prepareForEmbed: async function (filename = null) {
    if (!filename) return false;
    return await fetch(`${PYTHON_API}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Response could not be completed");
        return res.json();
      })
      .then((res) => res)
      .catch((e) => {
        console.log(e.message);
        return { success: false, reason: e.message };
      });
  },
};

module.exports.DocumentProcessor = DocumentProcessor;
