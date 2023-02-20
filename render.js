const script = document.currentScript;
fetch(`./components/${script.getAttribute("from")}`)
  .then((res) => res.text())
  .then((content) =>
    import(`data:text/javascript;base64,${btoa(jsx.parse(content))}`).then(
      ({ default: component }) => script.replaceWith(component)
    )
  );
