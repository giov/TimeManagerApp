var UI = function(){

	this.data = {};
	this.timer;

	this.db = openDatabase('mydb', '1.0', 'tm_database', 2 * 1024 * 1024);

	this.init = function(callback){

		var that = this;

		this.db.transaction(function (tx) {
		  tx.executeSql('CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY ASC, title TEXT, time INTEGER, created TEXT, last TEXT)');
		});

		this.getLocalStorage(function(){
			$.get('page-projects.html', function(data){
				$('.content').html(data);
				callback();
			});
		});

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

			var title = $('form .title').val();
			$('form .title').val("");

			var project = {
				title:title,
				time:0,
				created:0,
				last:0
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
	};

	this.setTimeToSQL = function(project_id,time){
		console.log('UPDATE projects SET time = "'+time+'"" WHERE id = "'+project_id+'"');
		this.db.transaction(function(tx){
			tx.executeSql('UPDATE projects SET time = '+time+' WHERE id = '+project_id);
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

	this.setDataToLocal = function(data,cb){
		this.data = data;
		cb();
	};

	this.getLocalStorage = function(cb){

		var that = this;
		var data = new Array();

		this.db.transaction(function (tx) {
		  tx.executeSql('SELECT * FROM projects', [], function (tx, results) {
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

		this.timer = window.setInterval(function(){
			that.data[project_id].time++;
			that.updateTimes();

			if(that.data[project_id].time%5==0)
				that.setTimeToSQL(project_id,that.data[project_id].time);
		},1000);

	};

	this.stopCounter = function(project_id){
		var that = this;

		// Change button
		$('.project-'+project_id).find('button.stop').text('START').removeClass('stop').addClass('start');

		window.clearInterval(this.timer);
		that.updateTimes();
	};

	this.getProjects = function(callback){
		// Refresh data

		callback();
	};

	this.showProjects = function(){
		$('.projects').html("");
		for(var i in this.data){
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
});
