
$(document).ready(function () {
   
    //功能选择
    $('.module li').on('click',function(){
        $('.module li').removeClass('active');
        $(this).addClass('active');
        var mapIframe = window.top.document.getElementById("mapIframe").contentWindow;
        var title = $(this).text();
        if(!title)return false;
        console.log(title);
        switch(title){
            case "区域分布" : mapIframe.PageMain.createRegion();break;
            case "热力演变" : mapIframe.PageMain.createHeatMap();break;
            case "省市支援" : mapIframe.PageMain.createSupport();break;
            case "热点直播" : mapIframe.PageMain.createTV();break;
            case "火神山模型" : mapIframe.PageMain.hssModule();break;
            case "雷神山模型" : mapIframe.PageMain.lssModule();break;
            case "切换三维" : mapIframe.PageMain.switchView();break;
            case "返回" : mapIframe.PageMain.back();break;
        }
    });
    //初始化页面
     //https://service-f9fjwngp-1252021671.bj.apigw.tencentcs.com/release/pneumonia
        //这里备份了一份数据，接口本地做了代理
        $.get('data/data.json',{},(data)=>{
        if(!data)return false;
        //数据处理
        var {statistics,listByArea,listByOther,timeline,listByCountry} = data.data;
        //创建实时播报
        var lis = "";
        timeline.forEach((item,index,arr)=>{
            lis += ""
            if(index%2 == 0){
                lis += '<li class="bg">';
            }else{
                lis += '<li>';
            }
            lis += `
            <p class="fl"><b>${item.infoSource}</b><br>
            ${item.title}<br>
            </p>
            <p class="fr pt17">${item.pubDateStr}</p>
            </li>`
           
        })
        var info01 = `<h2 class="tith2">实时播报</h2><div class="lefttoday_tit"><p class="fl">状态：已更新</p><p class="fr">时间段：${new Date().toLocaleDateString()}</p></div>
            <div class="left2_table">
            <ul>`+lis +`
            </ul>
            </div>`

        $(".arightboxtop").html(info01);

        //创建今日疫情
        var info02 = `<div class="lefttoday_tit" style=" height:8%"><p class="fl">地区：全国</p><p class="fr">${new Date().toLocaleDateString()}</p></div>
        <div class="lefttoday_number">
          <div class="widget-inline-box text-center fl">
            <p>确诊人数</p>
            <h3 class="ceeb1fd">${statistics.confirmedCount}</h3>
            <h4 class="text-muted pt6">较昨日<img src="img/iconup.png" height="16" />${statistics.confirmedIncr?statistics.confirmedIncr:'未更新'}</h4>
          </div>
          <div class="widget-inline-box text-center fl">
             <p>疑似人数</p>
            <h3 class="c24c9ff">${statistics.suspectedCount}</h3>
            <h4 class="text-muted pt6">较昨日<img src="img/iconup.png" height="16" />${statistics.suspectedIncr?statistics.suspectedIncr:'未更新'}</h4>
          </div>
          <div class="widget-inline-box text-center fl">
             <p>死亡人数</p>
            <h3 class="cffff00">${statistics.deadCount}</h3>
            <h4 class="text-muted pt6">较昨日<img src="img/iconup.png" height="16" />${statistics.deadIncr?statistics.deadIncr:'未更新'}</h4>
          </div>
          <div class="widget-inline-box text-center fl">
             <p>治愈人数</p>
            <h3 class="c11e2dd">${statistics.curedCount}</h3>
            <h4 class="text-muted pt6">较昨日<img src="img/iconup.png" height="16" />${statistics.curedIncr?statistics.curedIncr:'未更新'}</h4>
          </div>
        </div>`
        $(".aleftboxttop").html(info02);

        //创建疫情科普
        $(".aleftboxtbott").html(`
        <h2 class="tith2">病毒科普说明</h2>
        <div class="left2_table">
        <ul>
            <li> <p class="fl"><b>${statistics.note1}</b></p></li>
            <li> <p class="fl"><b>${statistics.note2}</b></p></li>
            <li> <p class="fl"><b>${statistics.note3}</b></p></li>
            <li> <p class="fl"><b>${statistics.remark1}</b></p></li>
            <li> <p class="fl"><b>${statistics.remark2}</b></p></li>
            <li> <p class="fl"><b>${statistics.remark3}</b></p></li>
        </ul>
        </div>`);

        //创建全国疫情对比
        var regionData = [],series = [],
        qz = {
            name:'确诊',
            type:'bar',
            barWidth : 30,
            stack: '丁香园',
            data:[]
        },sw = {
            name:'死亡',
            type:'bar',
            stack: '丁香园',
            data:[]
        },qy = {
            name:'痊愈',
            type:'bar',
            stack: '丁香园',
            data:[]
        };
        listByCountry.forEach((item,index,arr)=>{

            regionData.push(item.provinceShortName);
            qz.data.push(item.confirmed),sw.data.push(item.dead), qy.data.push(item.cured);
        });
        series = [qz,sw,,qy];
        createRegionEcharts(regionData,series);

        //创建疫情变化趋势图
        $('.arightboxbottcont').html(`<img style='width:100%;filter:grayscale(50%);' src='${statistics.quanguoTrendChart[0].imgUrl}'>`);
        $('.lefttime_text li').on('click',function(){
            $('.lefttime_text li').removeClass('active');
            var index = $(this).attr('index');
            $(this).addClass('active');
            if(!index)return false;
            $('.arightboxbottcont').html(`<img style='width:100%;filter:grayscale(50%);' src='${statistics.quanguoTrendChart[parseInt(index)].imgUrl}'>`);
        });
        //创建热门资讯
        var lis = "";
        statistics.marquee.forEach((item,index,arr)=>{
            lis += ""
            if(index%2 == 0){
                lis += '<li class="bg">';
            }else{
                lis += '<li>';
            }
            lis += `
            <a href=${item.marqueeLink}><p class="text_l">${item.marqueeContent}</p></a>
            <p class="text_r">${item.marqueeLabel}</p>
            </li>`
        });
        $('.aleftboxtmidd').html( `<h2 class="tith2 pt3">热门资讯</h2>
        <div class="left2_table pumiddboxttop2_cont">
            <ul>
              `+lis+`
            </ul>
         </div>`);
    });

})

/**
 * 初始化echart图表
 */
function createRegionEcharts(regionData,series){
    var myChart = echarts.init(document.getElementById('pmrboxbottom'));
    option = { 
        tooltip: {
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            }
        },
      color:['#d2d17c','#00b7ee','#d16ad8'],
        backgroundColor: 'rgba(1,202,217,.2)',
        legend: {
          top:10,
          textStyle:{
            fontSize: 10,
            color:'rgba(255,255,255,.7)'
          },
              data:['确诊','死亡','痊愈']
          },
          grid: {
              left: 10,
              right: 10,
              top: 40,
              bottom: 10,
              containLabel: true
          },

          xAxis : [
                 {
                     type : 'category',
                     axisLine:{
                       lineStyle:{
                         color:'rgba(255,255,255,.3)'
                       }
                     },
                     splitLine:{
                       lineStyle:{
                         color:'rgba(255,255,255,.01)'
                       }
                     },
                     data : regionData
                 }
             ],
          yAxis : [
              {
                axisLine:{
                  lineStyle:{
                    color:'rgba(255,255,255,.3)'
                  }
                },
                splitLine:{
                  lineStyle:{
                    color:'rgba(255,255,255,.01)'
                  }
                },

                axisLabel: {
                    formatter: '{value} 人'
                },
                  type : 'value'
              }

          ],
          series : series
          };
    myChart.setOption(option);
}
   
