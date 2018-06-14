(function() {
    $("form").on("submit", function() {
        sessionStorage.setItem("name", $("#username").val());
    });
})();