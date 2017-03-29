### 功能介绍
能够实现手势密码的设置和验证

### 设计思路
主线程：start->获取canvas初始位置,计算圆心坐标，绘制初始图案->绑定touch相关事件->绑定checkbox相关事件

### touch系列事件的流程
touch系列事件是本程序最核心的代码：
touchstart:清空之前记录的用户轨迹，重置一些参数
touchmove：
1. 清空画布，重新绘制初始图案
2. 根据用户轨迹以及当前坐标重新绘制线条(此处将事件对应的x,y与canvas初始坐标相减即可)
3. 判断用户是否滑动到轨迹中没有的圆内，如果有，将其加入用户轨迹，并从未滑过的圆中移除
4. 等待下一次触发
touchend:
1. 清空画布，重新绘制初始图案
2. 对用户输入进行判断，绘制相应的错误或者正确效果图，并进行提示
3. 复位一些参数，结束本次事件
4. 延迟几秒，清空画布，绘制初始图案

### 状态的控制
主要由两个变量来进行状态的控制：
1. model： set以及check
     set表示设置密码。check表示验证密码
2. set_time:在设置密码的时候有用，表示设置密码的次数，来控制touchend中相应的判决条件

### canvas的绘制
需要合理考虑的地方主要在于：
1. 圆相关的控制
    这里的话跟canvas画布的宽高有关，采用的大致类似于space-between这样的效果来进行圆心坐标以及半径的计算
    1. 圆心坐标(i:0-8):  x: canvas.width/3/2+i%3*canvas.width/3;
                        y: canvas.width/3/2+Math.floor(i/3) * canvas.height/3;
    2. 半径以及滑动轨迹的半径的设置：
            r : canvas.width/3/2/2 = width/12
            滑动轨迹的半径设置为r/2;
2. drawCircle的参数设置
      drawCircle(x,y,radius,shixin,color)
      radius:要画的圆的半径，默认为上一步说的半径
      shixin是一个boolean值，表示是否画实心圆还是空心圆(其实就是fill和stroke的区别)
      color:表示要画的圆的颜色，主要用于提示用户输入的正确性
   drawLine的相关参数也差不多，主要是用颜色来提示用户输入的正确性

### 优化
1. 没有采用jquery以及bootstrap,因为感觉本身功能不复杂，原生的js就够用了
2. 采用uglifyjs进行最小化压缩,减小js文件大小
3. 移动端布局的考虑：
      1. 主要是flex的使用，移动端的浏览器主要是webkit内核的，对flex的支持比较高
      2. 字体大小采用em,能合理显示文字的大小
      3. rem+scale的高清屏适配暂时没有考虑，可以是将来优化的一个点    

### 感想
本次的作业，本身难度并不是很高，主要是canvas以及移动端一些事件的处理。但是对细节部分的考察会多一点。
通过这次作业，其实是看出来贵公司对实习生的筛选的一个重视以及公平程度，相比电话，个人更喜欢这样的一个全面的考察，希望能去贵公司实习。