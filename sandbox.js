window.addEventListener("message", async function (event) {
  const data = event.data;
  if (data.action === "execute") {
    try {
      // Use 'new Function' to create a function that takes 'page' and 'document' as arguments.
      // This shadows the global 'document', giving the user the "feel" of native JS against the snapshot.
      const func = new Function("page", "document", data.code);

      let doc = null;
      if (data.context && data.context.html) {
        try {
          const parser = new DOMParser();
          doc = parser.parseFromString(data.context.html, "text/html");
        } catch (e) {
          console.error("DOM Parse Error", e);
        }
      }

      // Pass the parsed doc as the second argument named 'document'
      const result = func(data.context || {}, doc);
      event.source.postMessage({ result: result, id: data.id }, event.origin);
    } catch (e) {
      event.source.postMessage(
        { error: e.toString(), id: data.id },
        event.origin
      );
    }
  }
});
