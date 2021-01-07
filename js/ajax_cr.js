$(function() {
	// const
	var HOST_NAME = window.location.hostname;
	var LOCAL_SERVER_HOST = "http://dev.snack.emforce.co.kr:8000";
	var BETA_SERVER_HOST = "http://beta.op.pickdata.co.kr";
	var PRODUCTION_SERVER_HOST = "http://op.pickdata.co.kr";
	var AJAX_SERVER = "http://op.pickdata.co.kr";

	// if (HOST_NAME.indexOf("localhost") >= 0 || HOST_NAME.indexOf("218.232.122") >= 0) {
	// 	AJAX_SERVER = LOCAL_SERVER_HOST;
	// } else if (HOST_NAME.indexOf("beta.fb.pickdata.co.kr") >= 0) {
	// 	AJAX_SERVER = BETA_SERVER_HOST;
	// } else {
	// 	AJAX_SERVER = PRODUCTION_SERVER_HOST;
	// }

	// 페이징을 위한 객체
	var PAGE_OBJECT = {
		total_count: 0,
		total_page: 0,
		now_page: 1,
		start_pos: 0,
		end_pos: 10,
		view_page_count: 10
	};

	// 초기 호출
	ajax_search_creatives(1);

	// history 사용을 위한 초기값
	history.pushState("", document.title, window.location.pathname);

	// history - hash 값이 변경될때 처리
	$(window).on("hashchange",function() {
		console.log("hashchange");
		$(".pop_close").trigger("click");
	});

	// 화면에서 기본으로 적용하는 Jquery
	function init_common_js() {
		$('.roll_main_wrapper').slick({
			infinite: false,
			speed: 300,
			variableWidth: true,
		});

		/* 동영상 */
		$(".pop_contents .video_wrap").on("click",function(){
			$(this).find("video").get(0).play();
			$(this).find(".video_bg").hide();
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
			var History = window.History;
			if (History.enabled) {
				History.pushState(null, null, "#content");
			}

			$(this).siblings(".contents_pop").show();
			$(".search_contents_wrap > .paging").hide();
			$(".main_contents").hide();
			$('html, body').animate({
			scrollTop: $("header").offset().top},1);
		});

		// 컨텐츠 상세 팝업닫기
		$(".pop_close").click(function(){
			var History = window.History;
			if (History.enabled) {
				history.pushState("", document.title, window.location.pathname);
			}
			$(".contents_pop").hide();
			$(".search_contents_wrap > .paging").show();
			$(".main_contents").show();

			// 현재 닫기버튼 누를때 부모 찾기
			var parent = $(this).parent().parent();
			if (parent.attr("class") == "pop_contents_wrap") {
				var video = parent.find("video");
				// video 가 존재하는 경우
				if (video.length > 0) {
					for (var i=0; i<video.length; i++) {
						// video 정지 실행, try-catch 는 비디오 URL 예외처리를 위해
						try {
							video.get(i).pause();
						} catch (e) {
						}
					}
				}
			}
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
			add_creative_hub_complete_view(false);
		});

		// 페이징 클릭 시
		$("div.paging > div > ul > li").on("click", function(e) {
			e.preventDefault();
			if ($(this).text() == "") {
				if ($(this).hasClass("move_start")) {
					// 첫 페이지로 이동
					ajax_search_creatives(1);
				} else if ($(this).hasClass("move_before")) {
					// 이전 페이지로 이동
					if (PAGE_OBJECT.now_page > 1) {
						ajax_search_creatives(parseInt(PAGE_OBJECT.now_page) - 1);
					}
				} else if ($(this).hasClass("move_after")) {
					// 다음 페이지로 이동
					if (PAGE_OBJECT.total_page > PAGE_OBJECT.now_page) {
						ajax_search_creatives(parseInt(PAGE_OBJECT.now_page) + 1);
					}
				} else if ($(this).hasClass("move_end")) {
					// 마지막 페이지로 이동
					ajax_search_creatives(PAGE_OBJECT.total_page);
				}
				return;
			}
			var page_number = $(this).text();
			$("div.paging > div > ul > li").removeClass("now");
			$(this).addClass("now");
			// page_number 으로 이동
			ajax_search_creatives(page_number);
		});
	}

	function init_select_view() {
		// 셀렉트 박스 텍스트 넣기
		$(".select_view li").on("click",function(){
				$(this).parent().prev().find('p').text($(this).text());
				$(".select p").removeClass('arrow_up');
				$(".select_btn ul").hide();
				$('.select_view').removeClass('active');
		});
	}


	// 검색결화 화면 초기화
	function init_views() {
		$("ul[name=search_first] li").remove();
		$("ul[name=search_second] li").remove();
		$("div.paging > div > ul > li").remove();
		$("div.result_left").hide();
		$("div.paging").hide();
	}

	// 검색결과 전체 카운트 및 페이지 표시
	function view_result_count(total_count, total_page) {
		$("span[name=search_count]").text(total_count).digits();
		$("span[name=search_page_count]").text(total_page).digits();
		$("div.result_left").show();
	}

	// 검색결화 페이징 구성
	function view_paging() {
		var pos_num = Math.ceil(PAGE_OBJECT.now_page / PAGE_OBJECT.view_page_count);
		PAGE_OBJECT.start_pos = (pos_num - 1) * 10;
		PAGE_OBJECT.end_pos = pos_num * 10;

		var start_num = PAGE_OBJECT.start_pos;
		var end_num = (PAGE_OBJECT.end_pos > PAGE_OBJECT.total_page) ? PAGE_OBJECT.total_page : PAGE_OBJECT.end_pos;

		$("div.paging > div > ul").append('<li class="paging_icon move_start"><a href="javascript:"><img src="images/icon/paging_01.png" alt="" /></a></li>');
		$("div.paging > div > ul").append('<li class="paging_icon move_before"><a href="javascript:"><img src="images/icon/paging_03.png" alt="" /></a></li>');
		for (var i=start_num; i<end_num; i++) {
			if ((i+1) == PAGE_OBJECT.now_page) {
				$("div.paging > div > ul").append('<li class="now"><a href="javascript:">' + (i+1) + '</a></li>');
			} else {
				$("div.paging > div > ul").append('<li><a href="javascript:">' + (i+1) + '</a></li>');
			}
		}
		$("div.paging > div > ul").append('<li class="paging_icon move_after"><a href="javascript:"><img src="images/icon/paging_04.png" alt="" /></a></li>');
		$("div.paging > div > ul").append('<li class="paging_icon move_end"><a href="javascript:"><img src="images/icon/paging_02.png" alt="" /></a></li>');
	}


	// 공통 파라메터
	function make_parameters() {
		var params = {
			"search_text": $("div.main_search_wrap > input.main_search").val(),
			"device_type": get_device_type_code($("div[name=device_type]").text().replace(/\s/g, "")),
			"page_category_filter": get_page_category_filter_code($("div[name=page_category_filter]").text().replace(/\s/g, "")),
			"template_type": get_template_type_code($("div[name=template_type]").text().replace(/\s/g, "")),
			"call_to_action_type": get_call_to_action_type_code($("div[name=call_to_action_type]").text().replace(/\s/g, "")),
			"color_type": get_color_type_code($("div[name=color_type]").text().replace(/\s/g, "")),
			"order_type": get_order_type_code($("div[name=order_type]").text().replace(/\s/g, ""))
		};
		return params;
	}

	// 서버 AJAX 검색 호출
	function ajax_search_creatives(page_number) {
		init_views();
		loading_view(true);
		var search_url = "/creative_hubs/creative_library";
		var params = make_parameters();
		params['page'] = page_number;
		$.ajax({
			type: "GET",
			url: AJAX_SERVER + search_url,
			dataType: "json",
			data: params,
			success: function(res) {
				var success = res.success;
				var data = [];
				// var combo_values = {};
				if (success == "YES") {
					data = res.data;
					// combo_values = res.combo_values;
					// make_page_category_filter(combo_values);
					// make_template_types(combo_values);
					// make_call_to_action_type(combo_values);
					// make_color_type(combo_values);
					var list_ul = $("ul[name=search_first]");
					for (var i=0; i<data.length; i++) {
						var item = data[i];
						var template = make_template(item);
						list_ul.append(template);
						if (i % 4 == 3) {
							list_ul = $("ul[name=search_second]");
						}
					}
					PAGE_OBJECT['total_count'] = res.total_count;
					PAGE_OBJECT['total_page'] = res.total_page;
					PAGE_OBJECT['now_page'] = page_number;
					PAGE_OBJECT['start_pos'] = 0;
					PAGE_OBJECT['end_pos'] = 10;

					(res.total_count == 0) ? none_search_view(true) : none_search_view(false)
					view_result_count(res.total_count, res.total_page);
					view_paging();
				} else {
					// API Fail
				}
				init_common_js();
				loading_view(false);
				setTimeout(function() { window.parent.postMessage($('body').height() + '', '*'); }, 1500);
			},
			error: function(e) {
				// AJAX Error
				console.log(e);
				loading_view(false);
			}
		});
	}

	// 서버 AJAX 광고등록하기 호출
	function ajax_add_creative_hub() {
		var url_text = $("div[name=add_search] > input.main_search").val();
		if (url_text.trim().split(' ').join('') == "") {
			alert("광고 링크를 입력해주세요.")
			return;
		}
		loading_view(true);
		var url = "/creative_hubs/simple_insert_url";
		var params = {
			"url": url_text,
			"username": "creative_library"
		};
		$.ajax({
			type: "POST",
			url: AJAX_SERVER + url,
			dataType: "json",
			data: params,
			success: function(res) {
				var success = res.success;
				var msg = res.msg;
				if (success == "YES") {
					$("div[name=add_search] > input.main_search").val("");
					add_creative_hub_complete_view(true);
				} else {
					alert(msg);
					// API Fail
				}
				loading_view(false);
			},
			error: function(e) {
				// AJAX Error
				console.log(e);
				loading_view(false);
			}
		});
	}


	// Event - 검색어 입력 후 엔터키
	$("input[name=search_text]").on("keypress", function(e) {
		e.stopPropagation();
		if (e.keyCode == 13) {
			// ajax call
			ajax_search_creatives(1);
		}
	});

	// Event - 검색버튼 클릭
	$("button[name=search_button]").on("click", function(e) {
		e.preventDefault();
		// ajax call
		ajax_search_creatives(1);
	});

	// Event - 노출위치 선택
	$("ul[name=device_type] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_device_type_code(selected_text);

		ajax_search_creatives(1);
	});

	// Event - 정렬 선택
	$("ul[name=order_type] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_order_type_code(selected_text);
    if (selected_code == 'video_views') {
      var li = $("ul[name=template_type] > li");
      var video_views_li = null;
      for (var i=0; i<li.length; i++) {
        var item = $(li[i]);
        if (item.text().replace(/\s/g, "") == "단일동영상") {
          video_views_li = item;
        }
      }
      if (video_views_li != null) {
        video_views_li.trigger("click");
      } else {
        ajax_search_creatives(1);
      }
    } else {
      ajax_search_creatives(1);
    }
	});

	// Event - 업종 선택
	$("ul[name=page_category_filter] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_page_category_filter_code(selected_text);

		ajax_search_creatives(1);
	});

	// Event - 형식 선택
	$("ul[name=template_type] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_template_type_code(selected_text);

		ajax_search_creatives(1);
	});

	// Event - 행동유도 선택
	$("ul[name=call_to_action_type] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_call_to_action_type_code(selected_text);

		ajax_search_creatives(1);
	});

	// Event - 색상 선택
	$("ul[name=color_type] > li").on("click", function(e) {
		e.preventDefault();
		var selected_text = $(this).text().replace(/\s/g, "");
		var selected_code = get_color_type_code(selected_text);

		ajax_search_creatives(1);
	});

	// Event - URL 입력 후 엔터키
	$("div[name=add_search] > input.main_search").on("keypress", function(e) {
		e.stopPropagation();
		if (e.keyCode == 13) {
			// ajax call
			ajax_add_creative_hub();
		}
	});

	// Event - 광고등록 버튼 클릭
	$("div[name=add_search] > button").on("click", function(e) {
		e.preventDefault();
		// ajax call
		ajax_add_creative_hub();
	});

	// Event - 광고등록 완료페이지 버튼 클릭
	$("div[name=add_complete] > button").on("click", function(e) {
		e.preventDefault();
		// 처리가 다 안된다.. 나중에 확인해도 괜찮을듯.
		$(".clost_btn").trigger("click");
	});


	// 로딩화면 show & hide
	function loading_view(chk) {
		(chk) ? $("div.loading_wrap").show() : $("div.loading_wrap").hide();
	}

	// 검색결과없음 show & hide
	function none_search_view(chk) {
    (chk) ? $("div.none_search_wrap").show() : $("div.none_search_wrap").hide();
    (chk) ? $("div.paging").hide() : $("div.paging").show();
	}

	// 광고등록하기 화면 show & hide
	function add_creative_hub_view(chk) {
		(chk) ? $(".advertisement_pop").show() : $(".advertisement_pop").hide();
	}

	// 광고등록하기 완료 화면 show & hide
	function add_creative_hub_complete_view(chk) {
		(chk) ? $("div[name=add_complete]").show() : $("div[name=add_complete]").hide();
		(chk) ? $("div[name=add_info]").hide() : $("div[name=add_info]").show();
		(chk) ? $("div[name=add_search]").hide() : $("div[name=add_search]").show();
	}

	// 업종 셀렉트박스 생성
	function make_page_category_filter(combo_values) {
		$("ul[name=page_category_filter] li").remove();
		var page_filters = (combo_values.page_filters == null) ? [] : combo_values.page_filters;
		if (combo_values.page_filters == null) {
			$("ul[name=page_category_filter]").append("<li>업종 전체</li>");
			$("ul[name=page_category_filter]").append("<li>IT/Tech</li>");
			$("ul[name=page_category_filter]").append("<li>공공</li>");
			$("ul[name=page_category_filter]").append("<li>교육</li>");
			$("ul[name=page_category_filter]").append("<li>금융</li>");
			$("ul[name=page_category_filter]").append("<li>도/소매</li>");
			$("ul[name=page_category_filter]").append("<li>서비스</li>");
			$("ul[name=page_category_filter]").append("<li>쇼핑</li>");
			$("ul[name=page_category_filter]").append("<li>스포츠/레저</li>");
			$("ul[name=page_category_filter]").append("<li>엔터테인먼트</li>");
			$("ul[name=page_category_filter]").append("<li>여행/숙박</li>");
			$("ul[name=page_category_filter]").append("<li>예술/문화</li>");
			$("ul[name=page_category_filter]").append("<li>음식</li>");
			$("ul[name=page_category_filter]").append("<li>의료/건강</li>");
			$("ul[name=page_category_filter]").append("<li>인물</li>");
			$("ul[name=page_category_filter]").append("<li>자동차</li>");
			$("ul[name=page_category_filter]").append("<li>장소/건물</li>");
			$("ul[name=page_category_filter]").append("<li>제조</li>");
			$("ul[name=page_category_filter]").append("<li>종교</li>");
			$("ul[name=page_category_filter]").append("<li>패션/뷰티</li>");
			$("ul[name=page_category_filter]").append("<li>회사</li>");
			$("ul[name=page_category_filter]").append("<li>기타</li>");
		} else {
			$("ul[name=page_category_filter]").append("<li>업종 전체</li>");
			for (var i=0; i<page_filters.length; i++) {
				$("ul[name=page_category_filter]").append("<li>" + page_filters[i] + "</li>");
			}
		}
		init_select_view();

		// Event - 업종 선택
		$("ul[name=page_category_filter] > li").on("click", function(e) {
			e.preventDefault();
			var selected_text = $(this).text().replace(/\s/g, "");
			var selected_code = get_page_category_filter_code(selected_text);

			ajax_search_creatives(1);
		});
	}

	// 형식 셀렉트박스 생성
	function make_template_types(combo_values) {
		$("ul[name=template_type] li").remove();
		var template_types = (combo_values.template_types == null) ? [] : combo_values.template_types;
		if (combo_values.template_types == null) {
			$("ul[name=template_type]").append("<li>형식 전체</li>");
			$("ul[name=template_type]").append("<li>단일 이미지</li>");
			$("ul[name=template_type]").append("<li>단일 동영상</li>");
			$("ul[name=template_type]").append("<li>슬라이드</li>");
			$("ul[name=template_type]").append("<li>여러 이미지</li>");
		} else {
			$("ul[name=template_type]").append("<li>형식 전체</li>");
			var is_photo = false;
			var is_video = false;
			var is_carousel = false;
			var is_collection = false;
			for (var i=0; i<template_types.length; i++) {
				var template_type = template_types[i];
				if (template_type == "link_single_y" || template_type == "link_single_n"
					|| template_type == "photo_y" || template_type == "photo_n") {
					is_photo = true;
				}
				if (template_type == "video_y" || template_type == "video_n") {
					is_video = true;
				}
				if (template_type == "link_carousel_y" || template_type == "link_carousel_n"
					|| template_type == "video_carousel_y" || template_type == "video_carousel_n") {
					is_carousel = true;
				}
				if (template_type.indexOf("collections") > -1) {
					is_collection = true;
				}
			}

			if (is_photo) {
				$("ul[name=template_type]").append("<li>단일 이미지</li>");
			}
			if (is_video) {
				$("ul[name=template_type]").append("<li>단일 동영상</li>");
			}
			if (is_carousel) {
				$("ul[name=template_type]").append("<li>슬라이드</li>");
			}
			if (is_collection) {
				$("ul[name=template_type]").append("<li>여러 이미지</li>");
			}
		}
		init_select_view();

		// Event - 형식 선택
		$("ul[name=template_type] > li").on("click", function(e) {
			e.preventDefault();
			var selected_text = $(this).text().replace(/\s/g, "");
			var selected_code = get_template_type_code(selected_text);

			ajax_search_creatives(1);
		});
	}

	// 행동유도 셀렉트박스 만들기
	function make_call_to_action_type(combo_values) {
		$("ul[name=call_to_action_type] li").remove();
		var call_to_action_types = (combo_values.call_to_action_types == null) ? [] : combo_values.call_to_action_types;
		if (combo_values.call_to_action_types == null) {
			$("ul[name=call_to_action_type]").append("<li>행동유도 전체</li>");
			$("ul[name=call_to_action_type]").append("<li>버튼 없음</li>");
			$("ul[name=call_to_action_type]").append("<li>메뉴보기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 신청하기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 예약하기</li>");
			$("ul[name=call_to_action_type]").append("<li>문의하기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 기부하기</li>");
			$("ul[name=call_to_action_type]").append("<li>다운로드</li>");
			$("ul[name=call_to_action_type]").append("<li>더 알아보기</li>");
			$("ul[name=call_to_action_type]").append("<li>메시지 보내기</li>");
			$("ul[name=call_to_action_type]").append("<li>예약 요청하기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 구매하기</li>");
			$("ul[name=call_to_action_type]").append("<li>가입하기</li>");
			$("ul[name=call_to_action_type]").append("<li>동영상 더 보기</li>");
			$("ul[name=call_to_action_type]").append("<li>앱 사용하기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 설치</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 듣기</li>");
			$("ul[name=call_to_action_type]").append("<li>게임하기</li>");
			$("ul[name=call_to_action_type]").append("<li>견적보기</li>");
			$("ul[name=call_to_action_type]").append("<li>구독하기</li>");
			$("ul[name=call_to_action_type]").append("<li>링크 열기</li>");
			$("ul[name=call_to_action_type]").append("<li>지금 전화</li>");
			$("ul[name=call_to_action_type]").append("<li>찾아가는 길 보기</li>");
			$("ul[name=call_to_action_type]").append("<li>저장</li>");
		} else {
			$("ul[name=call_to_action_type]").append("<li>행동유도 전체</li>");
			for (var i=0; i<call_to_action_types.length; i++) {
				if (call_to_action_types[i] != null) {
					$("ul[name=call_to_action_type]").append("<li>" + get_call_to_action_type_text(call_to_action_types[i]) + "</li>");
				}
			}
		}
		init_select_view();

		// Event - 행동유도 선택
		$("ul[name=call_to_action_type] > li").on("click", function(e) {
			e.preventDefault();
			var selected_text = $(this).text().replace(/\s/g, "");
			var selected_code = get_call_to_action_type_code(selected_text);

			ajax_search_creatives(1);
		});
	}

	// 색상 셀렉트박스 만들기
	function make_color_type(combo_values) {
		$("ul[name=color_type] li").remove();
		var combo_colors = (combo_values.combo_colors == null) ? [] : combo_values.combo_colors;
		if (combo_values.combo_colors == null) {
			$("ul[name=color_type]").append('<li class="all_color">색상전체</li>');
			$("ul[name=color_type]").append('<li class="brown">갈색</li>');
			$("ul[name=color_type]").append('<li class="red">빨강</li>');
			$("ul[name=color_type]").append('<li class="orange">주황</li>');
			$("ul[name=color_type]").append('<li class="yellow">노랑</li>');
			$("ul[name=color_type]").append('<li class="yellow_green">연두</li>');
			$("ul[name=color_type]").append('<li class="green">초록</li>');
			$("ul[name=color_type]").append('<li class="skyBlue">하늘</li>');
			$("ul[name=color_type]").append('<li class="wave">파랑</li>');
			$("ul[name=color_type]").append('<li class="pink">분홍</li>');
			$("ul[name=color_type]").append('<li class="purple">보라</li>');
			$("ul[name=color_type]").append('<li class="white">흰색</li>');
			$("ul[name=color_type]").append('<li class="gray">회색</li>');
			$("ul[name=color_type]").append('<li class="black">검정</li>');
		} else {
			$("ul[name=color_type]").append('<li class="all_color">색상전체</li>');
			for (var i=0; i<combo_colors.length; i++) {
				if (combo_colors[i] == "brown") {
					$("ul[name=color_type]").append('<li class="brown">갈색</li>');
				} else if (combo_colors[i] == "red") {
					$("ul[name=color_type]").append('<li class="red">빨강</li>');
				} else if (combo_colors[i] == "orange") {
					$("ul[name=color_type]").append('<li class="orange">주황</li>');
				} else if (combo_colors[i] == "yellow") {
					$("ul[name=color_type]").append('<li class="yellow">노랑</li>');
				} else if (combo_colors[i] == "lightgreen") {
					$("ul[name=color_type]").append('<li class="yellow_green">연두</li>');
				} else if (combo_colors[i] == "green") {
					$("ul[name=color_type]").append('<li class="green">초록</li>');
				} else if (combo_colors[i] == "skyblue") {
					$("ul[name=color_type]").append('<li class="skyBlue">하늘</li>');
				} else if (combo_colors[i] == "blue") {
					$("ul[name=color_type]").append('<li class="wave">파랑</li>');
				} else if (combo_colors[i] == "pink") {
					$("ul[name=color_type]").append('<li class="pink">분홍</li>');
				} else if (combo_colors[i] == "purple") {
					$("ul[name=color_type]").append('<li class="purple">보라</li>');
				} else if (combo_colors[i] == "white") {
					$("ul[name=color_type]").append('<li class="white">흰색</li>');
				} else if (combo_colors[i] == "whitesmoke") {
					$("ul[name=color_type]").append('<li class="gray">회색</li>');
				} else if (combo_colors[i] == "black") {
					$("ul[name=color_type]").append('<li class="black">검정</li>');
				}
			}
		}
		init_select_view();

		// Event - 색상 선택
		$("ul[name=color_type] > li").on("click", function(e) {
			e.preventDefault();
			var selected_text = $(this).text().replace(/\s/g, "");
			var selected_code = get_color_type_code(selected_text);

			ajax_search_creatives(1);
		});
	}

	// 노출위치 파라메터 코드 생성
	function get_device_type_code(text) {
		var code = "all";
		if (text == "노출위치전체") {
			code = "all";
		} else if (text == "PC") {
			code = "PC";
		} else if (text == "Mobile") {
			code = "Mobile";
		}
		return code;
	}

	// 업종 파라메터 코드 생성
	function get_page_category_filter_code(text) {
		var code = text;
		if (text == "업종전체") {
			code = "all";
		}
		return code;
	}

	// 형식 파라메터 코드 생성
	function get_template_type_code(text) {
		var code = "all";
		if (text == "형식전체") {
			code = "all";
		} else if (text == "단일이미지") {
			// photo, link_single
			code = "photo";
		} else if (text == "단일동영상") {
			// video
			code = "video";
		} else if (text == "슬라이드") {
			// link_carousel, video_carousel
			code = "carousel";
		} else if (text == "여러이미지") {
			// collections_two_horizontal, collections_two_vertical, collections_four, collections_horizontal
			// collections_vertical, collections_three (케이스 1개), collections_sixteen (케이스1개)
			code = "collections";
		}
		return code;
	}

	// 행동유도 파라메터 코드 생성
	function get_call_to_action_type_code(text) {
		var code = "all";
		if (text == "행동유도전체") {
			code = "all";
		} else if (text == "버튼없음") {
			code = "NO_BUTTON";
		} else if (text == "메뉴보기") {
			code = "SEE_MENU";
		} else if (text == "지금신청하기") {
			code = "APPLY_NOW";
		} else if (text == "지금예약하기") {
			code = "BOOK_TRAVEL";
		} else if (text == "문의하기") {
			code = "CONTACT_US";
		} else if (text == "지금기부하기") {
			code = "DONATE_NOW";
		} else if (text == "다운로드") {
			code = "DOWNLOAD";
		} else if (text == "더알아보기") {
			code = "LEARN_MORE";
		} else if (text == "메시지보내기") {
			code = "MESSAGE_PAGE"; // MESSAGE_USER
		} else if (text == "예약요청하기") {
			code = "REQUEST_TIME";
		} else if (text == "지금구매하기") {
			code = "SHOP_NOW";
		} else if (text == "가입하기") {
			code = "SIGN_UP";
		} else if (text == "동영상더보기") {
			code = "WATCH_MORE";
		} else if (text == "앱사용하기") {
			code = "USE_APP"; //INSTALL_MOBILE_APP
		} else if (text == "지금설치") {
			code = "INSTALL_APP"; //USE_MOBILE_APP
		} else if (text == "지금듣기") {
			code = "LISTEN_MUSIC";
		} else if (text == "게임하기") {
			code = "PLAY_GAME";
		} else if (text == "견적보기") {
			code = "GET_QUOTE";
		} else if (text == "구독하기") {
			code = "SUBSCRIBE";
		} else if (text == "링크열기") {
			code = "OPEN_LINK";
		} else if (text == "지금전화") {
			code = "CALL_NOW";
		} else if (text == "찾아가는길보기") {
			code = "GET_DIRECTIONS";
		} else if (text == "저장") {
			code = "RECORD_NOW";
		} else if (text == "검색") {
			code = "SEARCH";
		} else if (text == "티켓구매") {
			code = "BUY_TICKETS";
		} else if (text == "관심있음") {
			code = "EVENT_RSVP";
		} else if (text == "지금주문하기") {
			code = "ORDER_NOW";
		}
		return code;
	}

	// 행동유도 코드 > 문자 변환
	function get_call_to_action_type_text(code) {
		var text = "버튼 없음";
		if (code == "all") {
			text = "행동유도 전체";
		} else if (code == "NO_BUTTON") {
			text = "버튼 없음";
		} else if (code == "SEE_MENU") {
			text = "메뉴보기";
		} else if (code == "APPLY_NOW") {
			text = "지금 신청하기";
		} else if (code == "BOOK_TRAVEL") {
			text = "지금 예약하기";
		} else if (code == "CONTACT_US") {
			text = "문의하기";
		} else if (code == "DONATE_NOW") {
			text = "지금 기부하기";
		} else if (code == "DOWNLOAD") {
			text = "다운로드";
		} else if (code == "LEARN_MORE") {
			text = "더 알아보기";
		} else if (code == "MESSAGE_USER" || code == "MESSAGE_PAGE") {
			text = "메시지 보내기";
		} else if (code == "REQUEST_TIME") {
			text = "예약 요청하기";
		} else if (code == "SHOP_NOW") {
			text = "지금 구매하기";
		} else if (code == "SIGN_UP") {
			text = "가입하기";
		} else if (code == "WATCH_MORE") {
			text = "동영상 더 보기";
		} else if (code == "USE_APP" || code == "USE_MOBILE_APP") {
			text = "앱 사용하기";
		} else if (code == "INSTALL_APP" || code == "INSTALL_MOBILE_APP") {
			text = "지금 설치";
		} else if (code == "LISTEN_MUSIC") {
			text = "지금 듣기";
		} else if (code == "PLAY_GAME") {
			text = "게임하기";
		} else if (code == "GET_QUOTE") {
			text = "견적보기";
		} else if (code == "SUBSCRIBE") {
			text = "구독하기";
		} else if (code == "OPEN_LINK") {
			text = "링크 열기";
		} else if (code == "CALL_NOW") {
			text = "지금 전화";
		} else if (code == "GET_DIRECTIONS") {
			text = "찾아가는 길 보기";
		} else if (code == "RECORD_NOW") {
			text = "저장";
		} else if (code == "SEARCH") {
			text = "검색";
		} else if (code == "BUY_TICKETS") {
			text = "티켓 구매";
		} else if (code == "EVENT_RSVP") {
			text = "관심 있음";
		} else if (code == "ORDER_NOW") {
			text = "지금 주문하기";
		} else if (code == "LIKE_PAGE") {
			// icon
			text = "좋아요";
		} else {
			console.log(code);
		}
		return text;
	}

	// 색상 파라메터 코드 생성
	function get_color_type_code(text) {
		var code = "all";
		if (text == "색상전체") {
			code = "all";
		} else if (text == "갈색") {
			code = "brown";
		} else if (text == "빨강") {
			code = "red";
		} else if (text == "주황") {
			code = "orange";
		} else if (text == "노랑") {
			code = "yellow";
		} else if (text == "연두") {
			code = "yellowgreen";
		} else if (text == "초록") {
			code = "green";
		} else if (text == "하늘") {
			code = "skyblue";
		} else if (text == "파랑") {
			code = "blue";
		} else if (text == "분홍") {
			code = "pink";
		} else if (text == "보라") {
			code = "puple";
		} else if (text == "흰색") {
			code = "white";
		} else if (text == "회색") {
			code = "gray";
		} else if (text == "검정") {
			code = "black";
		}
		return code;
	}

	// 정렬 파라메터 코드 생성
	function get_order_type_code(text) {
		var code = "created_at";
		if (text == "최근수집순") {
			code = "created_at";
		} else if (text == "좋아요순") {
			code = "like";
		} else if (text == "댓글순") {
			code = "comment";
		} else if (text == "공유순") {
			code = "shared";
		} else if (text == "동영상재생순") {
			code = "video_views";
		}
		return code;
	}

	// 해시태그 만들기
	function make_hashtags(creative_hashtags) {
		var hashtags = "";
		try {
			for (var i=0; i<creative_hashtags.length; i++) {
				var creative_hashtag = creative_hashtags[i];
				hashtags += "#" + creative_hashtag.hashtag.name + " ";
			}
		} catch (e) {
		}
		return hashtags;
	}

	// 페이스북 타겟 연령대에 맞추기
	function make_target_age_range(targets) {
		var min_age = 18;
		var max_age = 65;
		var min_ages = [];
		var max_ages = [];

		for (var i=0; i<targets.length; i++) {
			var target = targets[i];
			if (target.age >= 18 && target.age <= 24) {
				min_ages.push(18);
				max_ages.push(24);
			} else if (target.age >= 25 && target.age <= 34) {
				min_ages.push(25);
				max_ages.push(34);
			} else if (target.age >= 35 && target.age <= 44) {
				min_ages.push(35);
				max_ages.push(44);
			} else if (target.age >= 45 && target.age <= 54) {
				min_ages.push(45);
				max_ages.push(54);
			} else if (target.age >= 55 && target.age <= 64) {
				min_ages.push(55);
				max_ages.push(64);
			} else if (target.age >= 65) {
				min_ages.push(65);
				max_ages.push(65);
			}
		}
		min_age = Math.min.apply(Math, min_ages);
		max_age = Math.max.apply(Math, max_ages);

		if (min_age == 65) {
			return max_age + "+";
		} else if (max_age == 65) {
			return min_age + "-" + max_age + "+";
		} else {
			return min_age + "-" + max_age;
		}
	}

	// 타게팅 만들기
	function make_targeting(targeting) {
		var male_targets = [];
		var female_targets = [];
		for (var i=0; i<targeting.length; i++) {
			var target = targeting[i];
			if (target.gender == "male") {
				male_targets.push(target);
			} else {
				female_targets.push(target);
			}
		}
		var template_html =                    '<th><img src="images/icon/pop_right_men.jpg" alt="남자" /></th>';
		if (male_targets.length == 0) {
			template_html +=                    '<td>-</td>';
		} else {
			template_html +=                    '<td>';
			template_html +=                      '<div>';
			template_html +=                        '<p>' + make_target_age_range(male_targets) + ' 세</p>';
			template_html +=                      '</div>';
			template_html +=                    '</td>';
		}
		template_html +=                    '<th><img src="images/icon/pop_right_girl.jpg" alt="여자" /></th>';
		if (female_targets.length == 0) {
			template_html +=                    '<td>-</td>';
		} else {
			template_html +=                    '<td>';
			template_html +=                      '<div>';
			template_html +=                        '<p>' + make_target_age_range(female_targets) + ' 세</p>';
			template_html +=                      '</div>';
			template_html +=                    '</td>';
		}
		return template_html
	}

	// 단일이미지 검색결과 템플릿
	function photo_thumbnail(picture) {
		var template_html =    '<div class="cont_main">';
		template_html +=      '<div><img src="' + picture + '" alt="" /></div>';
		template_html +=    '</div>';
		return template_html;
	}

	// 단일이미지 상세 템플릿
	function photo_detail(picture) {
		var template_html =            '<div class="pop_cont_main">';
		template_html +=              '<div><img src="' + picture + '" alt="" /></div>';
		template_html +=            '</div>';
		return template_html;
	}

	// 단일동영상 검색결과 템플릿
	function video_thumbnail(source) {
		var template_html = '<div class="cont_main_tem_07">';
		template_html +=	'<div class="video_wrap">';
		template_html +=		'<div class="video_bg"></div>';
		template_html +=		'<video id="video_source" width="225" controls alt="재생버튼">';
		template_html +=			'<source src="' + source + '" type="video/mp4">';
		template_html +=			'<source src="' + source + '" type="video/ogg">';
		template_html +=		'</video>';
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
	}

	// 단일동영상 상세 템플릿
	function video_detail(source) {
		var template_html = '<div class="video_wrap">';
		template_html +=	'<div class="video_bg"></div>';
		template_html +=	'<video id="video_source" width="100%" controls alt="재생버튼">';
		template_html +=		'<source src="' + source + '" type="video/mp4">';
		template_html +=		'<source src="' + source + '" type="video/ogg">';
		template_html +=	'</video>';
		template_html += '</div>';
		return template_html;
	}

	// 슬라이드 검색결과 템플릿
	function carousel_thumbnail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}

		var template_html = '<div class="cont_main_tem_06">';
		template_html +=	'<div class="cont_roll05_wrap">';
		template_html +=		'<div class="roll_main_wrap">';
		template_html +=			'<ul class="roll_main_wrapper">';

		for (var i=0; i<subattachments.length; i++) {
			var subattachment = subattachments[i];
			if ((subattachment.type).indexOf("video") > -1) {
				// video
				template_html += '<li class="roll_content">';
				template_html +=	'<div>';
				template_html +=		'<div class="video_wrap">';
				template_html +=			'<div class="video_bg"></div>';
				template_html +=			'<video id="video_source" width="117" height="117" controls>';
				template_html +=				'<source src="'+ ((subattachment.source == null) ? subattachment.url : subattachment.source) + '" type="video/mp4">';
				template_html +=				'<source src="' + ((subattachment.source == null) ? subattachment.url : subattachment.source) + '" type="video/ogg">';
				template_html +=			'</video>';
				template_html +=		'</div>';
				template_html +=	'</div>';
				template_html +=	'<div class="request_wrap">';
				template_html +=		'<div>';
				if (subattachment.title!= null) {
					template_html +=			'<p class="title">' + subattachment.title + '</p>';
				}
				if (call_to_action_type != null && call_to_action_type != "NO_BUTTON") {
					template_html +=			'<div class="appli_btn">' + get_call_to_action_type_text(call_to_action_type) + '</div>';
				}
				template_html +=		'</div>';
				template_html +=	'</div>';
				template_html += '</li>';
			} else {
				// image
				if(subattachment.media != null) {
					template_html += '<li class="roll_content">';
					template_html +=	'<div>';
					template_html +=		'<div class="pro_img"><img src="' + subattachment.media.image.src + '" alt="이미지"/></div>';
					template_html +=	'</div>';
					template_html +=	'<div class="request_wrap">';
					template_html +=		'<div class="">';
					if (subattachment.title!= null) {
						template_html +=			'<p class="title">' + subattachment.title + '</p>';
					}
					if (call_to_action_type != null && call_to_action_type != "NO_BUTTON") {
						template_html +=			'<div class="appli_btn">' + get_call_to_action_type_text(call_to_action_type) + '</div>';
					}
					template_html +=		'</div>';
					template_html +=	'</div>';
					template_html += '</li>';
				}
			}
		}

		template_html +=			'</ul>';
		template_html +=		'</div>';
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
	}

	// 슬라이드 상세 템플릿
	function carousel_detail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}


		var template_html = '<div class="cont_main_tem_06">';
		template_html += '<div class="cont_roll05_wrap">';
		template_html +=	'<div class="roll_main_wrap">';
		template_html +=		'<ul class="roll_main_wrapper">';

		for (var i=0; i<subattachments.length; i++) {
			var subattachment = subattachments[i];
			if ((subattachment.type).indexOf("video") > -1) {
				// video
				template_html += '<li class="roll_content">';
				template_html +=	'<div>';
				template_html +=		'<div class="video_wrap">';
				template_html +=			'<div class="video_bg"></div>';
				template_html +=			'<video id="video_source" width="100%" height="291" controls alt="재생버튼">';
				template_html +=				'<source src="'+ ((subattachment.source == null) ? subattachment.url : subattachment.source) + '" type="video/mp4">';
				template_html +=				'<source src="' + ((subattachment.source == null) ? subattachment.url : subattachment.source) + '" type="video/ogg">';
				template_html +=			'</video>';
				template_html +=		'</div>';
				template_html +=	'</div>';
				template_html +=	'<div class="request_wrap">';
				template_html +=		'<div>';
				if (subattachment.title!= null) {
					template_html +=			'<p class="title">' + subattachment.title + '</p>';
				}
				if (call_to_action_type != null && call_to_action_type != "NO_BUTTON") {
					template_html +=			'<div class="appli_btn">' + get_call_to_action_type_text(call_to_action_type) + '</div>';
				}
				template_html +=		'</div>';
				template_html +=	'</div>';
				template_html += '</li>';
			} else {
				// image
				if(subattachment.media != null) {
					template_html += '<li class="roll_content">';
					template_html +=	'<div>';
					template_html +=		'<div class="pro_img"><img src="' + subattachment.media.image.src + '" alt="이미지"/></div>';
					template_html +=	'</div>';
					template_html +=	'<div class="request_wrap">';
					template_html +=		'<div class="">';
					if (subattachment.title!= null) {
						template_html +=			'<p class="title">' + subattachment.title + '</p>';
					}
					if (call_to_action_type != null && call_to_action_type != "NO_BUTTON") {
						template_html +=			'<div class="appli_btn">' + get_call_to_action_type_text(call_to_action_type) + '</div>';
					}
					template_html +=		'</div>';
					template_html +=	'</div>';
					template_html += '</li>';
				}
			}
		}

		template_html +=		'</ul>';
		template_html +=	'</div>';
		template_html += '</div>';
		template_html += '</div>';
		return template_html;
	}

	// collections_two_horizontal, collections_two_vertical, collections_four, collections_horizontal
	// collections_vertical, collections_three (케이스 1개), collections_sixteen (케이스1개)
	// 컬렉션 가로형 검색결과 템플릿
	function collections_horizontal_thumbnail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;

		var template_html = '<div class="cont_main_tem_02">';
		if (collection_length > 4) {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<4; i++) {
				var subattachment = subattachments[i];
				if (i < 3) {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
				} else {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /><div class="more_bg">' + (collection_length - 3) + '장+</div></div>';
				}
			}
			template_html +=	'</div>';
		} else {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<collection_length; i++) {
				var subattachment = subattachments[i];
				template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
			}
			template_html +=	'</div>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 컬렉션 가로형 상세 템플릿
	function collections_horizontal_detail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;

		var template_html = '<div class="pop_cont_main">';
		if (collection_length > 4) {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<4; i++) {
				var subattachment = subattachments[i];
				if (i < 3) {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
				} else {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /><div class="more_bg">' + (collection_length - 3) + '장+</div></div>';
				}
			}
			template_html +=	'</div>';
		} else {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<collection_length; i++) {
				var subattachment = subattachments[i];
				template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
			}
			template_html +=	'</div>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 컬렉션 세로형 검색결과 템플릿
	function collections_vertical_thumbnail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;

		var template_html = '<div class="cont_main_tem_03">';
		if (collection_length > 4) {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<4; i++) {
				var subattachment = subattachments[i];
				if (i < 3) {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
				} else {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /><div class="more_bg">' + (collection_length - 3) + '장+</div></div>';
				}
			}
			template_html +=	'</div>';
		} else {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<collection_length; i++) {
				var subattachment = subattachments[i];
				template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
			}
			template_html +=	'</div>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 컬렉션 세로형 상세 템플릿
	function collections_vertical_detail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;

		var template_html = '<div class="pop_cont_main">';
		if (collection_length > 4) {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<4; i++) {
				var subattachment = subattachments[i];
				if (i < 3) {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
				} else {
					template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /><div class="more_bg">' + (collection_length - 3) + '장+</div></div>';
				}
			}
			template_html +=	'</div>';
		} else {
			template_html +=	'<div class="main_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>';
			template_html +=	'<div class="sub_img">';
			for (var i=1; i<collection_length; i++) {
				var subattachment = subattachments[i];
				template_html +=		'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
			}
			template_html +=	'</div>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 컬렉션 4개 검색결과 템플릿
	function collections_four_thumbnail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 4) ? 4 : collection_length;

		var template_html = '<div class="cont_main_tem_04">';
		template_html +=	'<div class="main_img">';
		for (var i=0; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
		}
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
	}

	// 컬렉션 4개 상세 템플릿
	function collections_four_detail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 4) ? 4 : collection_length;

		var template_html = '<div class="main_img">';
		for (var i=0; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
		}
		template_html += '</div>';
		return template_html;
	}

  // 9.14 추가
  // 콜렉션 2개 위아래 검색결과 템플릿
  function collections_two_vertical_thumbnail(item) {
    var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 2) ? 2 : collection_length;

		var template_html = '<div class="cont_main_tem_08">';
		template_html +=	'<div class="main_img">';
		for (var i=0; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
		}
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
  }

  // 콜렉션 2개 위아래 상세템플릿
	function collections_two_vertical_detail(item) {
    var attachments = item.dic_attachments;
    var call_to_action_type = item.call_to_action_type;
    var data = {};
    var subattachments = [];
    if (attachments.data.length > 0) {
      data = attachments.data[0];
    }
    if (typeof data.subattachments == 'object') {
      subattachments = data.subattachments.data;
    }
    var collection_length = subattachments.length;
    var for_length = (collection_length > 2) ? 2 : collection_length;

    var template_html = '<div class="main_img">';
    for (var i=0; i<for_length; i++) {
      var subattachment = subattachments[i];
      template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
    }
    template_html += '</div>';
    return template_html;
	}

// 9.15 추가
  function collections_two_horizontal_thumbnail(item) {
    var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 2) ? 2 : collection_length;

		var template_html = '<div class="cont_main_tem_09">';
		template_html +=	'<div class="main_img">';
		for (var i=0; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
		}
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
  }

  // 콜렉션 3개 위아래 상세템플릿
	function collections_two_horizontal_detail(item) {
    var attachments = item.dic_attachments;
    var call_to_action_type = item.call_to_action_type;
    var data = {};
    var subattachments = [];
    if (attachments.data.length > 0) {
      data = attachments.data[0];
    }
    if (typeof data.subattachments == 'object') {
      subattachments = data.subattachments.data;
    }
    var collection_length = subattachments.length;
    var for_length = (collection_length > 2) ? 2 : collection_length;

    var template_html = '<div class="main_img">';
    for (var i=0; i<for_length; i++) {
      var subattachment = subattachments[i];
      template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
    }
    template_html += '</div>';
    return template_html;
	}
  // 콜렉션 3개 가로로 상세템플릿
  function collections_three_thumbnail(item) {
    var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 3) ? 3 : collection_length;

		var template_html = '<div class="cont_main_tem_10">';
		template_html +=	'<div class="main_img">';
		for (var i=0; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
		}
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
  }

  // 콜렉션 3개 가로로 상세템플릿
	function collections_three_detail(item) {
    var attachments = item.dic_attachments;
    var call_to_action_type = item.call_to_action_type;
    var data = {};
    var subattachments = [];
    if (attachments.data.length > 0) {
      data = attachments.data[0];
    }
    if (typeof data.subattachments == 'object') {
      subattachments = data.subattachments.data;
    }
    var collection_length = subattachments.length;
    var for_length = (collection_length > 3) ? 3 : collection_length;

    var template_html = '<div class="main_img">';
    for (var i=0; i<for_length; i++) {
      var subattachment = subattachments[i];
      template_html +=			'<div><img src="' + subattachment.media.image.src + '" alt="" /></div>';
    }
    template_html += '</div>';
    return template_html;
	}
  // 콜렉션 3개 상세템플릿
  function collections_three_vertical_thumbnail(item) {
    var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			data = attachments.data[0];
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}
		var collection_length = subattachments.length;
		var for_length = (collection_length > 3) ? 3 : collection_length;

		var template_html = '<div class="cont_main_tem_11">';
		template_html +=	'<div class="main_img">';
    template_html += '<div class="left_img"><img src="' + subattachments[0].media.image.src + '" alt="" /></div>'
    template_html += '<div class="right_img">'
		for (var i=1; i<for_length; i++) {
			var subattachment = subattachments[i];
			template_html +=			'<img src="' + subattachment.media.image.src + '" alt="" />';
		}
    template_html += '</div>';
		template_html +=	'</div>';
		template_html += '</div>';
		return template_html;
  }

  // 콜렉션 3개 상세템플릿
	function collections_three_vertical_detail(item) {
    var attachments = item.dic_attachments;
    var call_to_action_type = item.call_to_action_type;
    var data = {};
    var subattachments = [];
    if (attachments.data.length > 0) {
      data = attachments.data[0];
    }
    if (typeof data.subattachments == 'object') {
      subattachments = data.subattachments.data;
    }
    var collection_length = subattachments.length;
    var for_length = (collection_length > 3) ? 3 : collection_length;

    var template_html = '<div class="main_img">';
    template_html +=	'<div class="left_img"><img src="' + subattachments[0].media.image.src +'" alt="" /></div>';
    template_html += '<div class="right_img">';
    for (var i=1; i<for_length; i++) {
      var subattachment = subattachments[i];
      template_html +=		'<img src="' + subattachment.media.image.src + '" alt="" />';
    }
    template_html +=	'</div>';
    template_html += '</div>';
    return template_html;
	}

	// 표시된 상품 검색결과 템플릿
	function sub_attachments_thumbnail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			for (var i=0; i<attachments.data.length; i++) {
				var attachment = attachments.data[i];
				if (attachment.type == "commerce_product_mini_list") {
					data = attachment;
				}
			}
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}

		var template_html =    '<div class="cont_roll_wrap">';
		template_html +=      '<div class="roll_title">표시된제품:</div>';
		template_html +=      '<div class="roll_main_wrap">';
		template_html +=        '<ul class="roll_main_wrapper">';
		for (var i=0; i<subattachments.length; i++) {
			var subattachment = subattachments[i];
			template_html +=          '<li class="roll_content">';
			template_html +=            '<div>';
			template_html +=              '<div class="pro_img"><img src="' + subattachment.media.image.src + '" alt="이미지"/></div>';
			template_html +=              '<div class="pro_wrap">';
			template_html +=                '<p class="pro_name">' + subattachment.title + '</p>';
			template_html +=                '<p class="page_name">' + item.page.name + '</p>';
			if (subattachment.description != null) {
				template_html +=                '<p class="price_name">' + subattachment.description + '</p>';
			}
			template_html +=              '</div>';
			template_html +=            '</div>';
			template_html +=          '</li>';
		}
		template_html +=        '</ul>';
		template_html +=      '</div>';
		template_html +=    '</div>';
		return template_html;
	}

	// 표시된 상품 상세 템플릿
	function sub_attachments_detail(item) {
		var attachments = item.dic_attachments;
		var call_to_action_type = item.call_to_action_type;
		var data = {};
		var subattachments = [];
		if (attachments.data.length > 0) {
			for (var i=0; i<attachments.data.length; i++) {
				var attachment = attachments.data[i];
				if (attachment.type == "commerce_product_mini_list") {
					data = attachment;
				}
			}
		}
		if (typeof data.subattachments == 'object') {
			subattachments = data.subattachments.data;
		}

		var template_html =            '<div class="pop_cont_roll_wrap">';
		template_html +=      '<div class="roll_title">표시된제품:</div>';
		template_html +=      '<div class="roll_main_wrap">';
		template_html +=        '<ul class="roll_main_wrapper">';
		for (var i=0; i<subattachments.length; i++) {
			var subattachment = subattachments[i];
			template_html +=          '<li class="roll_content">';
			template_html +=            '<div>';
			template_html +=              '<div class="pro_img"><img src="' + subattachment.media.image.src + '" alt="이미지"/></div>';
			template_html +=              '<div class="pro_wrap">';
			template_html +=                '<p class="pro_name">' + subattachment.title + '</p>';
			template_html +=                '<p class="page_name">' + item.page.name + '</p>';
			if (subattachment.description != null) {
				template_html +=                '<p class="price_name">' + subattachment.description + '</p>';
			}
			template_html +=              '</div>';
			template_html +=            '</div>';
			template_html +=          '</li>';
		}
		template_html +=        '</ul>';
		template_html +=      '</div>';
		template_html +=    '</div>';
		return template_html;
	}

	// 행동유도 데이터 생성
	function make_call_to_action_data(item) {
		var name = "";
		var description = "";
		var caption = "";

		var cta_obj = item.dic_call_to_action;
		var cta_text = get_call_to_action_type_text(cta_obj.type);
		var cta_value = cta_obj.value;

		name = (cta_value.link_title == null) ? item.name : cta_value.link_title;
		description = (cta_value.link_description == null) ? item.description : cta_value.link_description;
		caption = (cta_value.link_caption == null) ? item.caption : cta_value.link_caption;

		if (cta_obj.type == "LIKE_PAGE") {
			var fan_count = parseInt(item.page.fan_count);
			name = (name == null) ? item.page.name : name;
			description = (description == null) ? item.page.category : description;
			caption = (caption == null) ? fan_count.format() + " 명이 좋아합니다." : caption;
		}

    if (cta_obj.type == "" || cta_obj.type == "NO_BUTTON") {
			cta_text = "";
		}

		return {
			cta_text: cta_text,
			name: (name == null) ? "" : name,
			description: (description == null) ? "" : description,
			caption: (caption == null) ? "" : caption
		}
	}

	// 행동유도 검색결과 템플릿
	function call_to_action_thumbnail(item) {
		var data = make_call_to_action_data(item);
    if (data.name == "" && data.description == "" && data.caption == "" && data.cta_text == "") {
      return '';
    }

		var template_html =    '<div class="cont_text">';
		template_html +=      '<div>';
		if (data.name != "") {
			template_html +=        '<p>' + data.name + '</p>';
		}
		if (data.description != "") {
			template_html +=        '<p>' + ((data.description.length > 100) ? data.description.substring(0, 100-3) + "..." : data.description) + '</p>';
		}
		if (data.caption != "") {
			template_html +=        '<p>' + data.caption + '</p>';
		}
		template_html +=      '</div>';
		template_html +=      '<div>';
		if (data.cta_text != "") {
			template_html +=        '<div class="appli_btn">' + data.cta_text + '</div>';
		}
		template_html +=      '</div>';
		template_html +=    '</div>';
		return template_html;
	}

	// 행동유도 상세 템플릿
	function call_to_action_detail(item) {
		var data = make_call_to_action_data(item);
    if (data.name == "" && data.description == "" && data.caption == "" && data.cta_text == "") {
      return '';
    }

		var template_html = '<div class="pop_cont_text">';
		template_html +=      '<div>';
		if (data.name != "") {
			template_html +=        '<p>' + data.name + '</p>';
		}
		if (data.description != "") {
			template_html +=        '<p>' + data.description + '</p>';
		}
		if (data.caption != "") {
			template_html +=        '<p>' + data.caption + '</p>';
		}
		template_html +=      '</div>';
		template_html +=      '<div>';
		if (data.cta_text != "") {
			template_html +=        '<div class="appli_btn">' + data.cta_text + '</div>';
		}
		template_html +=      '</div>';
		template_html +=    '</div>';
		return template_html;
	}

	// 노출위치에 따른 링크 템플릿
	function make_placements_link(item) {
		var placements = item.placements;
		var link_urls = item.link_urls;
		var is_mobile = ($.inArray("Mobile", placements) > -1) ? true : false;
		var is_pc = ($.inArray("PC", placements) > -1) ? true : false;

		var template_html = '';

		if (is_mobile && is_pc) {
			// 전부
			template_html += '<p><a href="' + link_urls.PC + '" target="_blank">PC원본보기</a></p>';
			template_html += '<p><a href="' + link_urls.Mobile + '" target="_blank">Mobile 원본 보기</a></p>';
		} else {
			if (is_mobile) {
				// 모바일 일때
				template_html += '<p><a href="' + link_urls.Mobile + '" target="_blank">원본보기</a></p>';
			} else {
				// PC 일때
				template_html += '<p><a href="' + link_urls.PC + '" target="_blank">원본보기</a></p>';
			}
		}

		return template_html;
	}

	// 노출위치 아이콘 표시 템플릿
	function find_placements_icon(item) {
		var placements = item.placements;
		var is_mobile = ($.inArray("Mobile", placements) > -1) ? true : false;
		var is_pc = ($.inArray("PC", placements) > -1) ? true : false;

		var template_html = '<div>';
		if (is_mobile && is_pc) {
			// 전부
			template_html += '<p><img src="images/icon/pop_right_icon_all.jpg" alt="전체" /></p>';
			template_html += '<p>전체</p>';
			// template_html += '</div><div>';
			// template_html += '<p><img src="images/icon/pop_right_icon_01.jpg" alt="컴퓨터" /></p>';
			// template_html += '<p>MOBILE</p>';
		} else {
			if (is_mobile) {
				// 모바일 일때
				template_html += '<p><img src="images/icon/pop_right_icon_mobile.jpg" alt="모바일" /></p>';
				template_html += '<p>MOBILE</p>';
			} else {
				// PC 일때
				template_html += '<p><img src="images/icon/pop_right_icon_01.jpg" alt="컴퓨터" /></p>';
				template_html += '<p>PC</p>';
			}
		}
		template_html += '</div>';

		return template_html;
	}

	// 광고형식 아이콘 표시 템플릿
	function find_template_type_icon(item) {
		var template_type = item.template_type;

		var template_html = '<div>';
		if (template_type == "video_y" || template_type == "video_n") {
			// 단일 동영상
			template_html += '<p><img src="images/icon/form_icon_01.jpg" alt="단일동영상" /></p>';
			template_html += '<p>단일 동영상</p>';
		} else if (template_type.indexOf("carousel") > -1) {
			// 슬라이드
			template_html += '<p><img src="images/icon/form_icon_03.jpg" alt="슬라이드" /></p>';
			template_html += '<p>슬라이드</p>';
		} else if (template_type.indexOf("collections_") > -1) {
			// 컬렉션
			template_html += '<p><img src="images/icon/form_icon_05.jpg" alt="여러이미지" /></p>';
			template_html += '<p>여러 이미지</p>';
		} else {
			// 단일 이미지
			template_html += '<p><img src="images/icon/pop_right_icon_02.jpg" alt="사진첩" /></p>';
			template_html += '<p>단일 이미지</p>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 색상 아이콘 표시 템플릿
	function find_color_icon(item) {
		var code = item.creative_representative_color;

		var template_html = '<div>';
		if (code == "brown") {
			template_html += '<p><img src="images/icon/color_2.jpg" alt="색상" /></p>';
			template_html += '<p>갈색</p>';
		} else if (code == "red") {
			template_html += '<p><img src="images/icon/color_3.jpg" alt="색상" /></p>';
			template_html += '<p>빨강</p>';
		} else if (code == "orange") {
			template_html += '<p><img src="images/icon/color_4.jpg" alt="색상" /></p>';
			template_html += '<p>주황</p>';
		} else if (code == "yellow") {
			template_html += '<p><img src="images/icon/color_5.jpg" alt="색상" /></p>';
			template_html += '<p>노랑</p>';
		} else if (code == "yellowgreen") {
			template_html += '<p><img src="images/icon/color_6.jpg" alt="색상" /></p>';
			template_html += '<p>연두</p>';
		} else if (code == "green") {
			template_html += '<p><img src="images/icon/color_7.jpg" alt="색상" /></p>';
			template_html += '<p>초록</p>';
		} else if (code == "skyblue") {
			template_html += '<p><img src="images/icon/color_8.jpg" alt="색상" /></p>';
			template_html += '<p>하늘</p>';
		} else if (code == "blue") {
			template_html += '<p><img src="images/icon/color_9.jpg" alt="색상" /></p>';
			template_html += '<p>파랑</p>';
		} else if (code == "pink") {
			template_html += '<p><img src="images/icon/color_10.jpg" alt="색상" /></p>';
			template_html += '<p>분홍</p>';
		} else if (code == "puple") {
			template_html += '<p><img src="images/icon/color_11.jpg" alt="색상" /></p>';
			template_html += '<p>보라</p>';
		} else if (code == "white") {
			template_html += '<p><img src="images/icon/color_12.jpg" alt="색상" /></p>';
			template_html += '<p>흰색</p>';
		} else if (code == "gray") {
			template_html += '<p><img src="images/icon/color_13.jpg" alt="색상" /></p>';
			template_html += '<p>회색</p>';
		} else if (code == "black") {
			template_html += '<p><img src="images/icon/color_14.jpg" alt="색상" /></p>';
			template_html += '<p>검정</p>';
		} else {
			template_html += '<p><img src="images/icon/pop_right_icon_03.jpg" alt="색상" /></p>';
			template_html += '<p>전체</p>';
		}
		template_html += '</div>';
		return template_html;
	}

	// 표시된 상품 템플릿 존재 여부 확인
	function is_sub_attachments(template_type) {
		var b = false;
		try {
			b = ((template_type[template_type.length-1]).toUpperCase() == "Y") ? true : false;
		} catch (e) {
		}
		return b;
	}

	// 행동유도 템플릿 존재 여부 확인
	function is_call_to_action(item) {
		var b = true;
		var template_type = item.template_type;
		if (template_type.indexOf("carousel") > -1) {
			return false;
		}
		if (item.call_to_action_type == null) {
			return false;
		}
		return b;
	}

	// 메세지 3줄 이상 체크
	function is_long_message_check(item) {
		var b = false;
		var message = (item.message == null) ? "" : item.message;
		var message_arr = message.split("\n");
		if (message_arr.length > 3) {
			b = true;
		}
		return b;
	}

	// 메세지 3줄이상 더보기 추가 및 변경
	function message_detail_convert(item) {
		var convert_message = "";
		var message = (item.message == null) ? "" : item.message;
		var message_arr = message.split("\n");
		if (is_long_message_check(item)) {
			message_arr = message_arr.slice(0, 3);
			convert_message = message_arr.join("\n");
		} else {
			if (message_arr.length == 3) {
				convert_message = message_arr.join("\n");
			} else {
				convert_message = message_arr.join("\n");
			}
		}
		if (convert_message.length > 85) {
			convert_message = convert_message.substr(0, 85);
			convert_message += '... <tt class="tag_hash">더보기</tt>';
		} else if (is_long_message_check(item)){
			convert_message += '... <tt class="tag_hash">더보기</tt>';
		}
		return convert_message;
	}

	// 전체적인 기본 템플릿
	function make_template(item) {
		var template_type = item.template_type;
		var sub_attachments_check = is_sub_attachments(template_type);
		var call_to_action_check = is_call_to_action(item);

		var template_html = '<li class="contents_wrapper">';
		template_html += '<div class="contents_title">';
		template_html +=    '<p>' + item.page.name + '</p>';
		template_html +=  '</div>';
		template_html +=  '<div class="main_contents">';
		template_html +=    '<div class="main_contents_mask"></div>';
		template_html +=    '<div class="cont_name_wrap">';
		template_html +=      '<div class="cont_name">';
		template_html +=        '<div><img src="'+ item.page.picture + '" alt="" ></div>';
		template_html +=        '<div>';
		template_html +=          '<p>' + ((item.page.name == null) ? "" : item.page.name) + '</p>';
		template_html +=          '<p>Sponsored</p>';
		template_html +=        '</div>';
		template_html +=      '</div>';
		// template_html +=      '<div class="cont_like_btn">페이지 좋아요</div>';
		template_html +=    '</div>';
		template_html +=    '<div class="cont_tag">';
		template_html +=      '<pre class="tag_text">' + convert_hashtag(message_detail_convert(item)) + '</pre>';
		// if (!is_long_message_check(item)) {
		// 	template_html +=      '<p class="tag_hash">' + make_hashtags(item.creative_hashtags) + '</p>';
		// }
		template_html +=    '</div>';

		if (template_type == "photo_y" || template_type == "link_single_y" || template_type == "photo_n" || template_type == "link_single_n") {
			template_html += photo_thumbnail(item.full_picture);
		} else if (template_type == "video_y" || template_type == "video_n") {
			template_html += video_thumbnail(item.source);
		} else if (template_type.indexOf("carousel") > -1) {
			template_html += carousel_thumbnail(item);
		} else if (template_type.indexOf("collections_horizontal") > -1) {
			template_html += collections_horizontal_thumbnail(item);
		} else if (template_type.indexOf("collections_vertical") > -1) {
			template_html += collections_vertical_thumbnail(item);
		} else if (template_type.indexOf("collections_four") > -1) {
			template_html += collections_four_thumbnail(item);
		} else if (template_type.indexOf("collections_two_vertical") > -1) {
			template_html += collections_two_vertical_thumbnail(item);
		} else if (template_type.indexOf("collections_two_horizontal") > -1) {
			template_html += collections_two_horizontal_thumbnail(item);
		} else if (template_type == "collections_three_n" || template_type == "collections_three_y") {
			template_html += collections_three_thumbnail(item);
		} else if (template_type.indexOf("collections_three_vertical") > -1) {
			template_html += collections_three_vertical_thumbnail(item);
		} else {
			template_html += photo_thumbnail(item.full_picture);
		}

		if (sub_attachments_check) {
			template_html += sub_attachments_thumbnail(item);
		}

		if (call_to_action_check) {
			template_html += call_to_action_thumbnail(item);
		}

		template_html +=    '<div class="favorite_wrap">';
		template_html +=      '<div><button><img src="images/icon/contents_img01.jpg" alt="" /></button><span>' + (item.total_reation_cnt).toLocaleString() + '</span></div>';
		template_html +=      '<div><button><img src="images/icon/contents_img02.jpg" alt="" /></button><span>' + (item.allstream_comment_cnt).toLocaleString() + '</span></div>';
		template_html +=      '<div><button><img src="images/icon/contents_img03.jpg" alt="" /></button><span>' + (item.shared_cnt).toLocaleString() + '</span></div>';
    if ((template_type == "video_y" || template_type == "video_n")) {
      template_html +=      '<div><button><img src="images/icon/contents_img04.jpg" alt="" /></button><span>' + (item.video_views).toLocaleString() + '</span></div>';
    }
		template_html +=    '</div>';
		template_html +=  '</div>';
		template_html +=  '<div class="contents_date">';
		template_html +=    '<p>' + new Date(item.created_at).format("yyyy-MM-dd, hh:mm a/p") + '</p>';
		template_html +=  '</div>';
		/////////////////////////////////////////////////////// 컨텐츠 상세 팝업 START ///////////////////////////////////////////////////////
		template_html +=  '<div class="contents_pop">';
		template_html +=    '<div class="pop_contents_wrap">';
		template_html +=      '<div class="pop_title_wrap">';
		template_html +=        '<div class="title_left">';
		template_html +=            '<span class="page_name">' + ((item.page.name == null) ? "" : item.page.name) + '</span>';
		template_html +=            '<span class="cate_name">' + ((item.page.category == null) ? "" : item.page.category) + '</span>';
		template_html +=        '</div>';
		template_html +=        '<div class="title_right pop_close"><img src="images/icon/pop_close_btn.png" alt="" /></div>';
		template_html +=      '</div>';
		template_html +=      '<div class="pop_contents">';
		template_html +=        '<div class="contents_left">';
		if (template_type == "photo_y" || template_type == "link_single_y" || template_type == "photo_n" || template_type == "link_single_n") {
			template_html +=          '<div class="pop_inner_contents_tem">';
		} else if (template_type == "video_y" || template_type == "video_n") {
			template_html +=          '<div class="pop_inner_contents_tem_07">';
		} else if (template_type.indexOf("carousel") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_06">';
		} else if (template_type.indexOf("collections_horizontal") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_02">';
		} else if (template_type.indexOf("collections_vertical") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_03">';
		} else if (template_type.indexOf("collections_four") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_04">';
		} else if (template_type.indexOf("collections_two_vertical") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_08">';
		} else if (template_type.indexOf("collections_two_horizontal") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_09">';
		} else if (template_type == "collections_three_n" || template_type == "collections_three_y") {
			template_html +=          '<div class="pop_inner_contents_tem_10">';
		} else if (template_type.indexOf("collections_three_vertical") > -1) {
			template_html +=          '<div class="pop_inner_contents_tem_11">';
		} else {
			template_html +=          '<div class="pop_inner_contents_tem">';
		}
		// template_html +=          '<div class="pop_inner_contents_tem">'; //////////////////
		template_html +=            '<div class="pop_cont_name_wrap">';
		template_html +=              '<div class="pop_cont_name">';
		template_html +=                '<div><img src="' + item.page.picture + '" alt="" ></div>';
		template_html +=                '<div>';
		template_html +=                  '<p>' + ((item.page.name == null) ? "" : item.page.name) + '</p>';
		template_html +=                  '<p>Sponsored</p>';
		template_html +=                '</div>';
		template_html +=              '</div>';
		template_html +=              '<div class="pop_cont_like_btn">페이지 좋아요</div>';
		template_html +=            '</div>';
		template_html +=            '<div class="pop_cont_tag">';
		template_html +=              '<pre class="tag_text">' + convert_hashtag((item.message == null) ? "" : item.message) + '</pre>';
		// template_html +=              '<p class="tag_hash">' + make_hashtags(item.creative_hashtags) + '</p>';
		template_html +=            '</div>';

		if (template_type == "photo_y" || template_type == "link_single_y" || template_type == "photo_n" || template_type == "link_single_n") {
			template_html += photo_detail(item.full_picture);
		} else if (template_type == "video_y" || template_type == "video_n") {
			template_html += video_detail(item.source);
		} else if (template_type.indexOf("carousel") > -1) {
			template_html += carousel_detail(item);
		} else if (template_type.indexOf("collections_horizontal") > -1) {
			template_html += collections_horizontal_detail(item);
		} else if (template_type.indexOf("collections_vertical") > -1) {
			template_html += collections_vertical_detail(item);
		} else if (template_type.indexOf("collections_four") > -1) {
			template_html += collections_four_detail(item);
		} else if (template_type.indexOf("collections_two_vertical") > -1) {
			template_html += collections_two_vertical_detail(item);
		} else if (template_type.indexOf("collections_two_horizontal") > -1) {
			template_html += collections_two_horizontal_detail(item);
		} else if (template_type == "collections_three_n" || template_type == "collections_three_y") {
			template_html += collections_three_detail(item);
		} else if (template_type.indexOf("collections_three_vertical") > -1) {
			template_html += collections_three_vertical_detail(item);
		} else {
			template_html += photo_detail(item.full_picture);
		}

		if (sub_attachments_check) {
			template_html += sub_attachments_detail(item);
		}

		if (call_to_action_check) {
			template_html += call_to_action_detail(item);
		}

		template_html +=            '<div class="pop_favorite_wrap">';
		template_html +=              '<div><span><img src="images/icon/pop_contents_img_01.png" alt="" /></span><span>' + (item.total_reation_cnt).toLocaleString() + '</span></div>';
		template_html +=              '<div><span><img src="images/icon/pop_contents_img_02.png" alt="" /></span><span>' + (item.allstream_comment_cnt).toLocaleString() + '</span></div>';
		template_html +=              '<div><span><img src="images/icon/pop_contents_img_03.png" alt="" /></span><span>' + (item.shared_cnt).toLocaleString() + '</span></div>';
    if ((template_type == "video_y" || template_type == "video_n")) {
		  template_html +=              '<div><span><img src="images/icon/pop_contents_img_04.png" alt="" /></span><span>' + (item.video_views).toLocaleString() + '</span></div>';
    }
		template_html +=            '</div>';
		template_html +=          '</div>';
		template_html +=          '<div class="pop_contents_date">';
		template_html +=            '<div class="left_date">' + new Date(item.created_at).format("yyyy-MM-dd, hh:mm a/p") + '</div>';
		template_html +=            '<div class="right">';
		// 노출 위치
		template_html += make_placements_link(item);
		template_html +=            '</div>';
		template_html +=          '</div>';
		template_html +=         '<div class="video_info_text">*&nbsp;광고가 종료되었거나 광고 소재 링크가 갱신된 경우, 광고 소재가 노출되지 않거나 "원본보기"가 불가능합니다.</div>';
		template_html +=        '</div>';
		template_html +=        '<div class="contents_right">';
		template_html +=          '<div class="right_icon_wrap">';

		// placements
		template_html += find_placements_icon(item);
		// template_type
		template_html += find_template_type_icon(item);
		// color
		template_html += find_color_icon(item);

		template_html +=          '</div>';
		template_html +=          '<div class="pop_detail">';
		template_html +=            '<div class="detail_wrap">';
		template_html +=              '<table class="detail_table_wrap">';
		template_html +=                '<colgroup>';
		template_html +=                  '<col width="80"/>';
		template_html +=                  '<col width="451"/>';
		template_html +=                '</colgroup>';
		template_html +=                '<tbody>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title"><div>문구</div></th>';
		template_html +=                    '<td class="right_detail">';
		template_html +=                      '<div class="detail_text">';
		template_html +=                        '<pre>' + ((item.message == null) ? "" : item.message) + '</pre>';
		template_html +=                      '</div>';
		if (item.message != null) {
			template_html +=                      '<div class="detail_text_limit">('+ ((item.message == null) ? "" : (item.message.length).toLocaleString()) + ' Text)</div>';
		}
		template_html +=                    '</td>';
		template_html +=                  '</tr>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title">제목</th>';
		template_html +=                    '<td class="right_detail">';
		template_html +=                      '<p>' + ((item.name == null) ? "-" : item.name) + '</p>';
		if (item.name != null) {
			template_html +=                      '<p class="text_info"><span class="detail_text_limit">('+ ((item.name == null) ? "-" : (item.name.length).toLocaleString()) + ' Text)</span></p>';
		}
		template_html +=                    '</td>';
		template_html +=                  '</tr>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title">링크설명</th>';
		template_html +=                    '<td class="right_detail">';
		template_html +=                      '<p>' + ((item.caption == null) ? "-" : item.caption) + '</p>';
		if (item.caption != null) {
			template_html +=                      '<p class="text_info"><span class="detail_text_limit">('+ ((item.caption == null) ? "-" : (item.caption.length).toLocaleString()) + ' Text)</span></p>';
		}
		template_html +=                    '</td>';
		template_html +=                  '</tr>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title">링크</th>';
    if ((template_type == 'video_y' || template_type == 'video_n') && item.call_to_action_type == null) {
      template_html +=                    '<td class="right_detail">' + "-" + '</td>';
    } else {
		  template_html +=                    '<td class="right_detail"><a href="' + ((item.link == null) ? "javascript:" : item.link) + '" target="_blank">' + ((item.link == null) ? "-" : item.link) + '</a></td>';
    }
    template_html +=                  '</tr>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title">행동유도</th>';
		template_html +=                    '<td class="right_detail">' + ((item.call_to_action_type == null) ? "-" : get_call_to_action_type_text(item.call_to_action_type)) + '</td>';
		template_html +=                  '</tr>';
		template_html +=                  '<tr>';
		template_html +=                    '<th class="left_title">해시태그</th>';
		template_html +=                    '<td class="right_detail">';
		template_html +=                      '<div class="hash_tag">';
		template_html +=                        '<p>' + ((make_hashtags(item.creative_hashtags) == "") ? "-" : make_hashtags(item.creative_hashtags)) + '</p>';
		template_html +=                      '</div>';
		template_html +=                    '</td>';
		template_html +=                  '</tr>';
		template_html +=                '</tbody>';
		template_html +=              '</table>';
		template_html +=            '</div>';
		template_html +=          '</div>';
		template_html +=          '<div class="target_wrap">';
		template_html +=            '<div class="target_title">추정 타겟팅 정보</div>';
		template_html +=            '<div class="target_detail">';
		template_html +=              '<table>';
		template_html +=                '<colgroup>';
		template_html +=                  '<col width="80"/>';
		template_html +=                  '<col width="183"/>';
		template_html +=                  '<col width="80"/>';
		template_html +=                  '<col width="183"/>';
		template_html +=                '</colgroup>';
		template_html +=                '<tbody>';
		template_html +=                  '<tr>';
		template_html += make_targeting(((item.targeting == null) ? [] : item.targeting));
		// template_html +=                    '<th><img src="images/icon/pop_right_men.jpg" alt="남자" /></th>';
		// template_html +=                    '<td>-</td>';
		// // template_html +=                    '<td>';
		// // template_html +=                      '<div>';
		// // template_html +=                        '<p>20-30세 (대한민국,&nbsp;서울)</p>';
		// // template_html +=                        '<p>35-40세 (대한민국,&nbsp;경기도)</p>';
		// // template_html +=                      '</div>';
		// // template_html +=                    '</td>';
		// template_html +=                    '<th><img src="images/icon/pop_right_girl.jpg" alt="여자" /></th>';
		// template_html +=                    '<td>-</td>';
		template_html +=                  '</tr>';
		template_html +=                '</tbody>';
		template_html +=              '</table>';
		template_html +=              '<p class="info_text">*페이스북 표본 집단을 토대로 추정한 정보이므로 100% 일치하지 않을 수도 있습니다.</p>';
		template_html +=            '</div>';
		template_html +=          '</div>';
		template_html +=        '</div>';
		template_html +=      '</div>';
		template_html +=    '</div>';
		template_html +=  '</div>';
		/////////////////////////////////////////////////////// 컨텐츠 상세 팝업 END ///////////////////////////////////////////////////////
		template_html +='</li>';

		return template_html;
	}

	// Number formatter
	$.fn.digits = function(){
		return this.each(function(){
			$(this).text( $(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") );
		})
	}

	// Number formatter2
	Number.prototype.format = function(){
		if(this==0) return 0;
		var reg = /(^[+-]?\d+)(\d{3})/;
		var n = (this + '');
		while (reg.test(n)) n = n.replace(reg, '$1' + ',' + '$2');
		return n;
	};

	// Date formatter
	Date.prototype.format = function(f) {
		if (!this.valueOf()) return " ";

		var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
		var d = this;

		return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
			switch ($1) {
				case "yyyy": return d.getFullYear();
				case "yy": return (d.getFullYear() % 1000).zf(2);
				case "MM": return (d.getMonth() + 1).zf(2);
				case "dd": return d.getDate().zf(2);
				case "E": return weekName[d.getDay()];
				case "HH": return d.getHours().zf(2);
				case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
				case "mm": return d.getMinutes().zf(2);
				case "ss": return d.getSeconds().zf(2);
				case "a/p": return d.getHours() < 12 ? "AM" : "PM";
				default: return $1;
			}
		});
	};

	String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
	String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
	Number.prototype.zf = function(len){return this.toString().zf(len);};

	function convert_hashtag(str) {
		return str.replace(/(^|\s)(#[0-9a-zA-Z가-힣]+)/ig, '$1<tt class="tag_hash">$2</tt>');
	}
})
