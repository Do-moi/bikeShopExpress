let radioButton = document.getElementsByName("modeLivraison");

for (var i = 0; i < radioButton.length; i++) {
  radioButton[i].addEventListener("change", function () {
    document.getElementById("formML").submit();
  });
}
