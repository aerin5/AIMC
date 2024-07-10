document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("searchButton");
    const resultPage = document.getElementById("resultPage");
    const searchPage = document.getElementById("searchPage");
  
    searchButton.addEventListener("click", (event) => {
      event.preventDefault();
      searchPage.style.display = "none";
      resultPage.style.display = "flex";
    });
  
    const searchAgainButton = document.getElementById("searchAgainButton");
    searchAgainButton.addEventListener("click", () => {
      // 검색 기능 추가 구현
    });
  
    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", () => {
      document.getElementById("searchPatientId").value = "";
      // 리셋 기능 추가 구현
    });
  });
  