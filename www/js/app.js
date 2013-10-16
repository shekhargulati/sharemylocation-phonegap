var Status = Backbone.Model.extend({
	urlRoot : "http://sharemylocation-shekhargulati.rhcloud.com/api/v1/statuses"
});
var Statuses = Backbone.Collection.extend({
	url : "http://sharemylocation-shekhargulati.rhcloud.com//api/v1/statuses"
});
var SearchResultCollection = Backbone.Collection.extend({
	url : function(){
		return "http://sharemylocation-shekhargulati.rhcloud.com/api/v1/statuses/" + this.searchQuery;
	}
});



var SearchView = Backbone.View.extend({
	el : ".page",
	
	events : {
		"submit #searchForm" : "searchStatus"
	},
	
	searchStatus : function(event){
		event.preventDefault();
		console.log("In searchStatus()... ");
		$("#results").empty();
		$("#searchForm").mask("Searching statuses ...");
		var hashtags = $("textarea#hashtags").val();
		var postedBy = $("#postedBy").val();
		var useGeoNear = $('#useGeoNear').is(":checked") ? true : false;
		
		var options = {
				hashtags : hashtags,
				postedBy : postedBy,
				useGeoNear : useGeoNear,
				formName : "#searchForm"
		};
		
		getCurrentPosition(searchViewCallback ,options);
		
	},
	
	render : function(){
		var template = _.template($("#search-status-template").html() , {});
		this.$el.html(template);
	}

});

function searchViewCallback(latitude , longitude , options){
	var searchResults = new SearchResultCollection();
	var query = longitude + "/" +latitude + "/?"+ "hashtags="+options.hashtags+"&user="+options.postedBy;
	if(options.useGeoNear){
		query = "geonear/" + query;
	}
	console.log("Search Query : "+query);
	searchResults.searchQuery = query;
	var that = this;
	searchResults.fetch({
		success : function(statuses) {
			var template = options.useGeoNear ? _.template($("#status-geonear-list-template").html(), {statuses : statuses.models}) : _.template($("#status-list-template").html(), {statuses : statuses.models});
			$("#results").append("<hr><h2>Search Results</h2><hr>");
			$("#results").append(template);
			$("#searchForm").unmask();
			$("#searchForm")[0].reset();
		}, error : function(){
			console.log("Error in getting search results...");
			$("#searchForm").unmask();
		}
	});
}

var PostView = Backbone.View.extend({
	el : ".page",
	
	events : {
		"submit #postForm" : "postStatus"
	},
	
	postStatus : function(event){
		event.preventDefault();
		console.log("In postStatus()... ");
		$("#postForm").mask("Posting status ...");
		var status = $("textarea#status").val();
		var postedBy = $("#postedBy").val();
		var useCurrentLocation = $('#useCurrentLocation').is(":checked") ? true : false;
		
		if(useCurrentLocation){
			var options = {
					status : status,
					postedBy : postedBy,
					formName : "#postForm"
			};
			getCurrentPosition(postViewCallback ,options);
		}else{
			var obj = {
				status : status,
				postedBy : postedBy,
			};
			var model = new Status();
			model.save(obj , {
				success : function(model, response, options){
					console.log("Post successfully saved without location.."+model);
					$("#postForm").unmask();
					app.navigate("#",{trigger:true});
				},error : function(model, xhr, options){
					console.log("Save Error");
					$("#postForm").unmask();
				}
			});
		}
	},
	
	render : function(){
		var template = _.template($("#status-post-template").html() , {});
		this.$el.html(template);
	}
});

function getCurrentPosition(callback , options){

	navigator.geolocation.getCurrentPosition(function(position){

					var longitude = position.coords.longitude;
			    	var latitude = position.coords.latitude;
			    	callback(latitude , longitude , options);
				}, function(e){
					$(options.formName).unmask();
					switch (e.code) {
						case e.PERMISSION_DENIED:
							alert('You have denied access to your position. You will ' +
									'not get the most out of the application now.'); 
							break;
						case e.POSITION_UNAVAILABLE:
							alert('There was a problem getting your position.'); 
							break;
						case e.TIMEOUT:
									alert('The application has timed out attempting to get ' +
											'your location.'); 
							break;
						default:
							alert('There was a horrible Geolocation error that has ' +
									'not been defined.');
					}
				},
					{ timeout: 45000 }

				);
}

function postViewCallback(latitude , longitude , options){
	var obj = {
			status : options.status,
			postedBy : options.postedBy,
			location : {
				type : "POINT",
				coordinates : [longitude , latitude]
			}
		};
	var model = new Status();
	console.log("before save");
	model.save(obj , {
		success : function(model, response, options){
			console.log("Post successfully saved with location.."+model);
			$("#postForm").unmask();
			app.navigate("#",{trigger:true});
		},error : function(model, xhr, options){
			console.log("Save Error");
			$("#postForm").unmask();
		}
	});
}

var HomeView = Backbone.View.extend({
	el : ".page",
	render : function() {
		var statuses = new Statuses();
		var that = this;
		statuses.fetch({
			success : function(statuses) {
				var template = _.template($("#status-list-template").html(), {
					statuses : statuses.models
				});
				that.$el.html(template);
			}
		});

	}
});

var Router = Backbone.Router.extend({
	routes : {
		"" : "home",
		"post" : "post",
		"search" : "search"
	},

});


var homeView = new HomeView();
var postView = new PostView();
var searchView = new SearchView();

var app = new Router();

app.on("route:home", function(){
	console.log("Show home page");
	homeView.render();
});

app.on("route:post", function(){
	console.log("Show post page");
	postView.render();
});

app.on("route:search", function(){
	console.log("Show search page");
	searchView.render();
});
Backbone.history.start();