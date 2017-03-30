;(function(window,undefined){
  //变量声明
  /*
  包括以下几个类型：
  1. dom节点，进行缓存，避免反复查找
  2. 中间数据，user_touched,user_notouch进行存储
  3. 状态数据，第几次设置密码，当前所处的模式等
  4. canvas相关数据，高度，宽度等
  */
  var availHeight = screen.availHeight;
  var availWidth = screen.availWidth;
  document.getElementById("h5lock").style.height = availHeight+"px";
  var canvas=document.getElementById("canvas");
  var hint_info = document.getElementById("hint");
  var radio = document.getElementById("radio");
  var reset = document.getElementById('reset');
  var checkbox = document.querySelectorAll("input[name='model']");
  canvas.width = 300;
  canvas.height = 300;
  var ctx=canvas.getContext("2d");
  var circles=[];
  var r = canvas.width/12;
  var canvas_pos = {};
  var user_touched = [];
  var user_notouch = [];
  var code = [];
  var flag = false;
  var model = "set";
  var user_code = [0,1,2,4,6,7,8];
  localStorage.setItem('code',user_code);
  var set_time = 0;
  var error_color = '#ff0000';
  var correct_color = '#00ff00';


  //函数声明以及定义
  /*
  根据canvas的宽度和高度计算圆心坐标
  返回值是9个圆心坐标组成的数组
  */
  function getCircles(){
    var circles = [];
    for(var i=0;i<9;i++){
      var pos={};
      pos.x = canvas.width/3/2+i%3*canvas.width/3;
      pos.y = canvas.width/3/2+Math.floor(i/3)*canvas.height/3;
      circles.push(pos);
    }
    return circles;
  }


  /*
  画圆
  提供圆心坐标，会根据默认的r进行画圆，就是9个带解锁的圈圈
  提供radius，会将其作为半径进行画圆
  shixin，如果为真，则圆是实心的，否则就是空心的
  color，控制圆的颜色，用于提醒用户密码的设置成功与否，默认black
  */
  function drawCircle(x,y,radius,shixin,color){
    var circle_r = radius || r;
    var circle_color = color || "#000000";
    ctx.fillStyle=circle_color;
    ctx.strokeStyle=circle_color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y,circle_r, 0,2*Math.PI);
    ctx.closePath();
    if(shixin){
      ctx.fill();
    }else {
      ctx.stroke();
    }
  }

  /*
  画线
  trace，表示用户已经滑动过的点，会进行直接连线
  posx,posy，表示用户本次触摸的最后一个点，会随着用户的
             手指进行移动，如果是Undefined就不进行最后一个连线
  color:控制线条颜色，默认black
  */
  function drawLine(trace,posx,posy,color){
    ctx.strokeStyle=color || '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trace[0].x,trace[0].y);
    for(var i=1,len = user_touched.length;i<len;i++){
      ctx.lineTo(trace[i].x,trace[i].y);
    }
    if(posx && posy){
      ctx.lineTo(posx,posy);
    }
    ctx.stroke();
    ctx.closePath();
  }

  /*
  获取canvas画布的起始点相对于视窗的坐标，进而可以通过pageX和pageY来判断用户手指位置
  返回值是canvas画布(0,0)相对于视窗最左侧的点的坐标
  */
  function getcanvasPos(canvas){
    var pos = {};
    pos.x = 0;
    pos.y = 0;
    var node = canvas;
    while(node){
      pos.x += node.offsetLeft;
      pos.y += node.offsetTop;
      node = node.offsetPatent;
    }
    return pos;
  }

  /*
  touch事件的绑定函数
  主要是进行一起清空和初始化工作
  */
  function start(event){
    flag = true;
    code = [];
    user_touched = [];
    user_notouch = circles.slice().map(function(value,index){
      value.index = index;
      return value;
    });
  }

  /*
  用户touchmove的绑定函数，比较关键
  大致的流程如下：
  1. 清空画布
  2. 根据用户触摸过的9点轨迹进行连线
  3. 根据目前用户的手指位置进行连线
  4. 判断用户的手指是否接触到之前没有触摸过的点之一
  5. 如果接触到，就将该点push到user_touched数组中，同时从user_notouch中移除并记录i
  */
  function update(event){
    if(flag){
        // console.log(event.type);
        event.preventDefault();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        circles.map(function(item){
          drawCircle(item.x,item.y);
        });

        var posx = event.touches?event.touches[0].pageX - canvas_pos.x : event.pageX - canvas_pos.x;
        var posy = event.touches?event.touches[0].pageY - canvas_pos.y : event.pageY - canvas_pos.y;

        if(user_touched.length!==0){
          drawLine(user_touched,posx,posy);
          for(var i=0,len = user_touched.length;i<len;i++){
            drawCircle(user_touched[i].x,user_touched[i].y,r/2,true);
          }
        }

        for(var i=0,len = user_notouch.length;i<len;i++){
          if(posx >= (user_notouch[i].x-r) && posx <= (user_notouch[i].x+r)
              && posy>=(user_notouch[i].y-r) && posy <= (user_notouch[i].y+r)){
            user_touched.push(user_notouch[i]);
            code.push(user_notouch[i].index);
            user_notouch.splice(i,1);
            break;
          }
        }
    }
  }

  /*
  touchend事件的绑定函数，也很关键
  大致的思路如下：
  1. 判断当前所处的模式，是set还是check
  2. 如果是set，判断当前点数是否小于5，进行相应提示
       大于5，根据当前是第几次设置来进行相应的效果显示
  3. 如果是check，直接判断用户的触摸顺序和localStorage中的是否一致即可
  */
  function end(event){
    var color;
    if(flag){
      flag = false;
       if(model === "set"){
         if(code.length<5){
           color = error_color;
           hint_info.innerHTML = "密码太短，至少需要5个点";
           setTimeout(function(){
             hint_info.innerHTML = "请重新设置初始密码";
           },1000);
           set_time = 0;
         }else if(set_time === 1){
                 if(code.toString() !== user_code.toString()){
                   color = error_color;
                   hint_info.innerHTML = "两次密码不一致";
                   setTimeout(function(){
                     hint_info.innerHTML = "请重新设置初始密码"
                   },1000);
                 }else{
                   color = correct_color;
                   hint_info.innerHTML = "密码设置成功";
                   user_code = code.slice();
                   localStorage.setItem('code',user_code);
                 }
                 set_time = 0;
               }else if(set_time === 0){
                 user_code = code.slice();
                 set_time++;
                 color = correct_color;
                 hint_info.innerHTML = "请再次输入手势密码";
               }
       }else if(model === "check"){
         if(code.toString() !== localStorage.code){
           color = error_color;
           hint_info.innerHTML = "输入的密码不正确";
         }else {
           color = correct_color;
           hint_info.innerHTML = "密码正确!";
         }
       }
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       circles.map(function(item){
         drawCircle(item.x,item.y);
       });
       if(user_touched.length!==0){
         drawLine(user_touched,undefined,undefined,color);
         for(var i=0,len = user_touched.length;i<len;i++){
           drawCircle(user_touched[i].x,user_touched[i].y,r/2,true);
           drawCircle(user_touched[i].x,user_touched[i].y,undefined,undefined,color);
         }
       }
       setTimeout(function(){
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         circles.map(function(item){
           drawCircle(item.x,item.y);
         });
       },500);
     }
  }


  /*
  检测用户的选择的改变进行
  相应的文字设置以及状态设置
  */
  function change(event){
    model = event.target.value;
    set_time = 0;
    if(model === "set"){
      hint_info.innerHTML = "请设置初始密码";
    }else if(model === "check"){
      if(localStorage.code){
        hint_info.innerHTML = "请输入正确的手势密码";
      }else{
        hint_info.innerHTML = "您还没有设置密码";
        setTimeout(function(){
          event.target.checked = false;
          checkbox[0].checked = true;
          hint_info.innerHTML = "请先设置密码";
        },500);
      }
    }
  }

  /*
  重置密码按钮的click绑定事件
  删除localStorage中的密码，并进行相关提示
  */
  function reset_code(){
    set_time = 0;
    model = 'set';
    checkbox[0].checked = true;
    checkbox[1].checked = false;
    hint_info.innerHTML = "旧密码已删除，请重新设置密码";
    delete localStorage.code;
  }

  /*
  所有函数的调用来实现最终的功能
  大致的流程如下：
  1. 获取初始参数：圆心坐标等，初始化一些状态数值
  2. 事件绑定
  3. 等待用户触发相关事件
  */
  function init(){
    circles = getCircles();
    user_notouch = circles.slice().map(function(value,index){
      value.index = index;
      return value;
    });
    circles.map(function(item){
      drawCircle(item.x,item.y);
    });
    canvas_pos = getcanvasPos(canvas);
    canvas.addEventListener("touchstart",start);
    canvas.addEventListener("touchmove",update);
    canvas.addEventListener("touchend",end);

    radio.addEventListener("change",change);
    reset.addEventListener('click',reset_code);
    canvas.addEventListener("mousedown",start);
    canvas.addEventListener("mousemove",update);
    canvas.addEventListener("mouseup",end);
  }

  //执行初始化函数
  init();


}(window,undefined))
