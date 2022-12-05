$(document).ready(function(){
	const toggleBtn = document.querySelector(".navbar_toggleBtn");
	const toggleClose = document.querySelector(".hambuger")
	const menu = document.querySelector(".pop_menu");
	const filter = document.querySelector(".filter");
	
	toggleBtn.addEventListener("click", () => {
	  menu.classList.toggle("active");
	  filter.classList.toggle("active2");
	});
	$('.close').click(function(){
		$('.pop_menu').removeClass('active');
		$('.filter').removeClass('active2');
	});
});