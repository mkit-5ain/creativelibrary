$(function(){
	$('.roll_main_wrapper').slick({
		infinite: false,
		speed: 300,
		variableWidth: true,
	});

	/* 동영상 */
	$(".pop_contents .video_wrap").on("click",function(){
		$(this).find("video").get(0).play();
		$(this).find(".video_bg").hide();
	})

	$(".select").on("click",function(e){
		e.stopPropagation();
		$(this).parent().find('p').addClass('arrow_up');
		var aactive = $(this).siblings('.select_view').hasClass("active");
		if(aactive == false){
				$(".select").siblings('.select_view').hide().removeClass('active');
				$(this).siblings('.select_view').show().addClass('active');
				$(this).parent().find('p').addClass('arrow_up');
		}else{
				$(this).siblings('.select_view').hide().removeClass('active');
				$(".select p").removeClass('arrow_up');
		}
	});

	$('body, html').click(function() {
		$('.select_view').hide();
		 $(".select p").removeClass('arrow_up');
	});

	// 셀렉트 박스 텍스트 넣기
	$(".select_view li").on("click",function(){
			$(this).parent().prev().find('p').text($(this).text());
			$(".select p").removeClass('arrow_up');
			$(".select_btn ul").hide();
			$('.select_view').removeClass('active');
	});

	// 컨텐츠 상세 팝업열기
	$(".main_contents").on("click",function(){
		$(this).siblings(".contents_pop").show();
		$(".search_contents_wrap > .paging").hide();
		$(".main_contents").hide();
		$('html, body').animate({
		scrollTop: $("header").offset().top},1);
		$(".video_bg").show();
	});

	// 컨텐츠 상세 팝업닫기
	$(".pop_close").click(function(){
		$(".contents_pop").hide();
		$(".search_contents_wrap > .paging").show();
		$(".main_contents").show();
		var vid = document.getElementById("video_source");
		vid.pause();
	});

	// 광고등록 팝업열기
	$(".button_right button").on("click",function(){
		$(".advertisement_pop").show();
		$(".button_right button").addClass("active");
	});

	// 광고등록 팝업닫기
	$(".clost_btn").click(function(){
		$(".advertisement_pop").hide();
		$(".button_right button").removeClass("active");
	});
})
