var UI = function(){

	this.data = {};
	this.timer;
	this.timetemp=0;

	this.db = openDatabase('mydb', '1.0', 'tm_database', 2 * 1024 * 1024);
	this.paidRatio = 25;

	this.getDate = function(){
		var dateObj = new Date();
		var month = dateObj.getUTCMonth();
		var day = dateObj.getUTCDate();
		var year = dateObj.getUTCFullYear();
		return year + "-" + month + "-" + day;
	};

	this.sampleData = function(){
		this.db.transaction(function (tx) {
			// tx.executeSql('INSERT INTO projects (id, title, time, created, last) VALUES (2, "Sample project 1", "7340", "2014-4-11", "2014-5-11")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "2", "5000", "2014-4-26")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "2", "2340", "2014-4-28")');

			// tx.executeSql('INSERT INTO projects (id, title, time, created, last) VALUES (3, "Sample project 2", "5000", "2014-12-11", "2014-3-11")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "3", "2000", "2014-4-16")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "3", "3000", "2014-4-26")');

			// tx.executeSql('INSERT INTO projects (id, title, time, created, last) VALUES (4, "Sample project 3", "12300", "2014-12-11", "2014-3-11")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "4", "6000", "2014-5-2")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "4", "6000", "2014-4-12")');
			// tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "4", "300", "2014-4-15")');
		});
	}

	this.displayMainAnalytics = function(analytics){

		var labels = new Array();
		var data = new Array();
		var totalTime=0;

		$('.analytics').append('<div class="details"></div>');

		for(var i in analytics){
			var date = new Date(analytics[i].date);
			var month = date.getMonth()+2;
			date = date.getDate()+"/"+(month)+"/"+date.getFullYear();
			labels[i]=date;
			
			data[i]=analytics[i].time;
			$('.analytics').append('<div class="date" data-date="'+analytics[i].date+'"><span class="date_elem">'+date+' </span><span class="time_elem">'+analytics[i].time+"</span></div>");
		
			totalTime+=analytics[i].time;
		}

		var earned = Math.round((totalTime/3600)*this.paidRatio)+"$";
		$('.analytics').prepend('<div class="summary">Last month, you earned </strong>'+earned+' and you worked '+totalTime+"</div>");

		labels.reverse();
		data.reverse();

		var ctx = document.getElementById("chart1").getContext("2d");
		var data = {
			labels : labels,
			datasets : [
				{
					fillColor : "rgba(151,187,205,0.5)",
					strokeColor : "rgba(151,187,205,1)",
					pointColor : "rgba(151,187,205,1)",
					pointStrokeColor : "#fff",
					data : data
				}
			]
		}
		var options = {
			bezierCurve : false
		};

		new Chart(ctx).Line(data,options);
	};

	this.getAnalytics = function(){

		var that = this;

		var dateObj = new Date();
		var month = dateObj.getUTCMonth();
		var day = dateObj.getUTCDate()+1;
		var year = dateObj.getUTCFullYear();

		var analytics = {};
		var sql_conditions = "";

		for(var i=0;i<=31;i++){

			var d = new Date(year, month, day-i);
			var month_proj = d.getUTCMonth();
			var day_proj = d.getUTCDate();
			var year_proj = d.getUTCFullYear();
			var date_proj = year_proj + "-" + month_proj + "-" + day_proj;

			analytics[i]={
				date:date_proj,
				time:0,
				nb:0
			};

			sql_conditions+=" date = '"+date_proj+"' OR";
		}

		sql_conditions = sql_conditions.substring(0, sql_conditions.length - 3);
		
		this.db.transaction(function(tx){
			tx.executeSql('SELECT * FROM stats WHERE'+sql_conditions, [], function(tx2, results){
				var len = results.rows.length;

				for(i = 0; i < len; i++){
					for(var index in analytics){
						if (analytics[index].date==results.rows.item(i).date){
							analytics[index].time+=results.rows.item(i).time;
							analytics[index].nb++;
						}
					}
			    }

			    that.displayMainAnalytics(analytics);
			});
		});
	

	};

	this.loadTimersPage = function(callback){
		var that = this;
		this.getLocalStorage(function(){
			$.get('page-projects.html', function(data){
				$('.content').html(data);
				callback(callback);

				$('.ratio').val(that.paidRatio);
			});
		});
	};

	this.displayDetailsAnalytics = function(date,projects){
		var html = "<h2>Details of the day</h2>";
		for(var i in projects){
			html+="<div class='project_details'>"+projects[i].title+" : "+projects[i].time+"</div>";
		}

		$('.details').html(html);

	};

	this.loadAnalyticsPage = function(){
		var that = this;
		this.getLocalStorage(function(){
			$.get('page-analytics.html', function(data){
				$('.content').html(data);
				that.getAnalytics();
				$(document).delegate('.date','click',function(){
					var date = $(this).attr('data-date');
					that.db.transaction(function(tx){
						tx.executeSql('SELECT * FROM stats WHERE date="'+date+'"', [], function(tx2, results){
							
							// Get all the projects, and count all the time by project
							var len = results.rows.length;
							var projects = new Array();
							for (i = 0; i < len; i++){
								var p_id = results.rows.item(i).project_id;
								if(projects[p_id] == undefined){
									projects[p_id]={time:results.rows.item(i).time};
								}else{
									projects[p_id].time+=results.rows.item(i).time;
								}
						    }

						    // Creating array for SQL request
						    var req = " ";
						    for(var i in projects)
						    	req += "id = "+i+" OR ";
						    req = req.substring(0, req.length - 3)

						    // Adding data
						    tx.executeSql('SELECT * FROM projects WHERE'+req, [], function(tx2, results){
								var len = results.rows.length;
								for(i = 0; i < len; i++){
									projects[results.rows.item(i).id].title = results.rows.item(i).title;
									projects[results.rows.item(i).id].created = results.rows.item(i).created;
									projects[results.rows.item(i).id].last = results.rows.item(i).last;
								}

							    that.displayDetailsAnalytics(date,projects);
							});
						});
					});
				});
			});
		});
	};

	this.init = function(callback){

		var that = this;
		var date = this.getDate();

		that.getRatio();

		this.db.transaction(function (tx) {
		  tx.executeSql('CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY ASC, title TEXT, time INTEGER, created DATE, last DATE)');
		  tx.executeSql('CREATE TABLE IF NOT EXISTS stats (id INTEGER PRIMARY KEY ASC, project_id INTEGER, time INTEGER, date DATE)');
		  tx.executeSql('CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY ASC, param TEXT, value TEXT)');
		});

		that.loadTimersPage(callback);

		// Init events
		$(document).delegate('button.start','click',function(){
			var project_id = $(this).attr('data-projectid');
			that.startCounter(project_id);
		});

		$(document).delegate('button.stop','click',function(){
			var project_id = $(this).attr('data-projectid');
			that.stopCounter(project_id);
		});

		$(document).delegate('form.addproject','submit',function(){

			var title = $('form.addproject .title').val();
			$('form.addproject .title').val("");

			var project = {
				title:title,
				time:0,
				created:date,
				last:date
			};

			var i = 0;
			for(var i2 in that.data){
				i++;
			}

			that.data[i+1]=project;

			that.setLocalStorage(function(){
				that.showProjects();
			});

			return false;
		});

		$(document).delegate('form.ratioh','submit',function(){

			var ratio = $('form.ratioh .ratio').val();

			that.updateRatio(ratio);

			return false;
		});

		$('.sidebar ul li').on('click',function(){
			var link = $(this).attr('data-link');

			$('.sidebar ul li').removeClass('active');
			$(this).addClass('active');

			if(link=="timers"){
				that.loadTimersPage(callback);
			}else if(link=="analytics"){
				that.loadAnalyticsPage();
			}
		});
	};

	this.setTimeToSQL = function(project_id,time){
		var that = this;
		this.db.transaction(function(tx){
			tx.executeSql('UPDATE projects SET time = '+time+', last = "'+that.getDate()+'" WHERE id = '+project_id);
		});
	};

	this.setLocalStorage = function(cb){
		var that = this;
		this.db.transaction(function (tx) {
			for(var i in that.data){
				tx.executeSql('SELECT * FROM projects WHERE title = "'+that.data[i].title+'"', [], function (tx2, results) {
					var len = results.rows.length;
					if(len<=0){
						tx.executeSql('INSERT INTO projects (id, title, time, created, last) VALUES (null, "'+that.data[i].title+'", "'+that.data[i].time+'", "'+that.data[i].created+'", "'+that.data[i].last+'")');
					}
					cb();
				});
			}
		});
	};

	this.updateRatio = function(ratio){
		var that = this;
		this.db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM config WHERE param = "ratio"', [], function (tx2, results) {
				var len = results.rows.length;
				console.log(len);
				if(len<=0){
					tx.executeSql('INSERT INTO config (id, param, value) VALUES (null, "ratio", "'+ratio+'")');
				}else{
					tx.executeSql('UPDATE config SET value = "'+ratio+'" WHERE param = "ratio"');
				}
				that.getRatio();
			});
		});
	};

	this.getRatio = function(){
		var that = this;
		this.db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM config WHERE param = "ratio"', [], function (tx2, results) {
				var len = results.rows.length;
				if(len!=0){
					that.paidRatio = results.rows.item(0).value;
					$('.ratio').val(that.paidRatio);
				}
			});
		});
	}

	this.setDataToLocal = function(data,cb){
		this.data = data;
		cb();
	};

	this.getLocalStorage = function(cb){

		var that = this;
		var data = new Array();

		this.db.transaction(function (tx) {
		  tx.executeSql('SELECT * FROM projects ORDER BY created ASC', [], function (tx, results) {
		    var len = results.rows.length, i;
		    for (i = 0; i < len; i++){
		    	data[results.rows.item(i).id]={
		    		title:results.rows.item(i).title,
					time:results.rows.item(i).time,
					created:results.rows.item(i).created,
					last:results.rows.item(i).last
		    	};
		    }
		    that.setDataToLocal(data,cb);
		  });
		});
	};

	this.startCounter = function(project_id){
		var that = this;

		// setinterval
		window.clearInterval(this.timer);
		$('button.stop').text('START').removeClass('stop').addClass('start');

		// Change button
		$('.project-'+project_id).find('button.start').text('STOP').removeClass('start').addClass('stop');

		that.timetemp = that.data[project_id].time;

		this.timer = window.setInterval(function(){
			that.data[project_id].time++;
			that.updateTimes();

			//if(that.data[project_id].time%5==0)
				that.setTimeToSQL(project_id,that.data[project_id].time);

		},1000);

	};

	this.stopCounter = function(project_id){
		var that = this;

		// Change button
		$('.project-'+project_id).find('button.stop').text('START').removeClass('stop').addClass('start');

		var date = this.getDate();
		var time = that.data[project_id].time - that.timetemp;

		this.db.transaction(function (tx) {
			tx.executeSql('INSERT INTO stats (id, project_id, time, date) VALUES (null, "'+project_id+'", "'+time+'", "'+date+'")');
		});

		window.clearInterval(this.timer);
		that.updateTimes();
	};

	this.getProjects = function(callback){
		// Refresh data

		callback();
	};

	this.showProjects = function(){
		$('.projects').html("");
		var data = this.data;

		for(var i in data){
			$('.projects').append('<div class="project project-'+i+'" data-projectid="'+i+'"><h2>'+this.data[i].title+'</h2><p class="time">'+this.data[i].time+'</p><button data-projectid="'+i+'" class="start">START</button></div>');
		}
	};

	this.updateTimes = function(){
		var that = this;
		$('.project').each(function(index){
			var project_id = $(this).attr('data-projectid');
			$(this).find('.time').text(that.data[project_id].time);
		});
	}
}

var main = new UI();

main.init(function(){
	main.showProjects();
	//main.sampleData();
});
