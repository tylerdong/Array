var jTerm = 19019;
var bonus=[];//单注奖金
var bonuszj=[];//追加单注奖金
var pie=[];//派奖单注奖金
var pieaward=[];//派奖追加单注奖金
var pieFlg=[];//派奖标识
var isAp = 0;//是否派奖
var isDT = false;
$(document).ready(function(){
    matchTerm();//init
    $("#dxnav input[type='radio']").change(function(){//胆拖or普通
        var id= $(this).index("input[type='radio']");
        id == 0?isDT=false:isDT=true;
        $("#formdxtab .pt").hide();
        $("#formdxtab .pt").eq(id).show();
        initSel();
    });
    //普通投注计算投注金额
    $("#div1_zt select").bind("change",function(){
        zhushuInit();
    });
    //胆拖投注
    $("#dfore_num").bind("change",function(){
        var val = Number($(this).val());
        $("#tfore_num").html(initOption(Number(5)-val,Number(35)-val));
        $("#dfore_true").html(initOption(0,val));
        $("#tfore_true").html(initOption(0,$("#tfore_num").val()>5?5:$("#tfore_num").val()));
        zhushuInit();
    });
    $("#tfore_num").bind("change",function(){
        var val = Number($(this).val());
        var df = Number($("#dfore_true").val());
        $("#tfore_true").html(initOption(0,val>5-df?5-df:val));
        zhushuInit();
    });
    $("#dback_num").bind("change",function(){
        var val = Number($(this).val());
        $("#tback_num").html(initOption(Number(2)-val,Number(12)-val));
        $("#dback_true").html(initOption(0,val));
        $("#tback_true").html(initOption(0,$("#tback_num").val()>2?2:$("#tback_num").val()));
        zhushuInit();
    });
    $("#tback_num").bind("change",function(){
        var val = Number($(this).val());
        var db = Number($("#dback_true").val());
        $("#tback_true").html(initOption(0,val>2-db?2-db:val));
        zhushuInit();
    });
    $("#dfore_true").bind("change",function(){
        var  val = Number($(this).val());
        var  tfold = Number($("#tfore_true").val());
        var  tf  = Number($("#tfore_num").val());
        var  end = 5-val<tf?5-val:tf;
        $("#tfore_true").html(initOption(0,end));
        tfold>end?$("#tfore_true").val(0):$("#tfore_true").val(tfold);
    });
    $("#dback_true").bind("change",function(){
        var  val = Number($(this).val());
        var  tbold= $("#tback_true").val();
        var  tb  = Number($("#tback_num").val());
        var  end = 2-val<tb?2-val:tb;
        $("#tback_true").html(initOption(0,end));
        tbold>end?$("#tback_true").val(0):$("#tback_true").val(tbold);
    });
    $("input[type='checkbox']").bind("change",function(){
        zhushuInit();
        initSingleBonus();
        calBonus();
    });
    $("#pro").bind("change",function(){
        zhushuInit();
        initSingleBonus();
        calBonus();
    });
    $(".submit").click(function(){
        submitCount();
    });
    //期号查询
    $("#selectMatch_term").change(function(){
        showD($(this).val());
        submitCount();
    });
});
/*
* 中奖条件eg：5+2，qq:5,hq:2
* */
function  getCon(qq,hq){
    var res = 0;
    if(isDT == true){
        var qdt = Number($("#dfore_num").val());
        var qtt = Number($("#tfore_num").val());
        var hdt = Number($("#dback_num").val());
        var htt = Number($("#tback_num").val());
        var qdm = Number($("#dfore_true").val());
        var qtm = Number($("#tfore_true").val());
        var hdm = Number($("#dback_true").val());
        var htm = Number($("#tback_true").val());
        var qfmt = (5-qq)-(qdt-qdm);
        var hfmt = (2-hq)-(hdt-hdm);
        res = c(qtm,qq-qdm)*c(qtt-qtm,qfmt)*c(htm,hq-hdm)*c(htt-htm,hfmt);
    }else{
        var qt = Number($("#fore_num").val());
        var ht = Number($("#back_num").val());
        var qm = Number($("#fore_true").val());
        var hm = Number($("#back_true").val());
        res = c(qm,qq)*c(qt-qm,5-qq)*c(hm,hq)*c(ht-hm,2-hq);
    }
    return res;
}
function  submitCount(){
    var singlejj = $("table[name='tab']:visible tr");
    for(var i=1;i<singlejj.length;i++){
        var arrs = $(singlejj[i]).children("td").eq(1).text().split(",");
        var zhushu = 0;
        for(var j=0;j<arrs.length;j++){
            var qh = arrs[j].split("+");
            zhushu += getCon(qh[0],qh[1]);
        }
        $(singlejj[i]).children("td").eq(2).text(zhushu+"注");
    }
    calBonus();
}
function jc(m,n,mn){
    var fz = 1;
    for(var i=m;i>mn;i--){
        fz *= i;
    }
    var fm = n;
    for(var j=1;j<n;j++){
        fm *=j;
    }
    return fz/fm;
}
/*
    * Cmn = m!/(m-n)!*n!
    * */
function c(m,n) {
    var m = Number(m);
    var n = Number(n);
    var result;
    if(m<n || m < 0 || n < 0 ){
        result = 0;
    }else if(m==n){
        result = 1;
    }else{
        var mn = Number(m-n);
        n == 0?result=1:result = jc(m,n,mn);
    }
    return result;
}
function zhushuInit(){
    var zhushu = 1;
    if(isDT){
        var dfore_num = $("#dfore_num").val();//前区胆码投注
        var tfore_num = $("#tfore_num").val();//前区拖码投注
        var dback_num = $("#dback_num").val();//后区胆码投注
        var tback_num = $("#tback_num").val();//后区拖码投注
        zhushu = c(tfore_num,Number(5)-Number(dfore_num))*c(tback_num,Number(2)-Number(dback_num));
    }else{
        var fore_num = $("#fore_num").val();//前区投注
        var back_num = $("#back_num").val();//后区投注
        zhushu = c(fore_num,5)*c(back_num,2);
    }
    var zj_btn = $("input[type='checkbox']:visible");
    var jine= $(zj_btn)[0].checked == true?Number(zhushu)*3:Number(zhushu)*2;
    $("span[name='zhu']:visible").text(zhushu);
    $("span[name='jine']:visible").text(jine);
}
function initOption(start,end){
    var html = '';
    for(var i=start;i<=end;i++){
        html+='<option value="'+i+'">'+i+'个</option>';
    }
    return html;
}
function initSel(){
    $(".pt select").each(function(){
        $(this).val(0);
    });
    //初始化我的投注下拉框（普通投注和胆拖投注）
    $("#fore_num").val(5);
    $("#back_num").val(2);
    $("#dfore_num").val(1);
    $("#tfore_num").val(4);
    $("#tfore_num").html(initOption(4,34));
    $("#dback_num").val(0);
    $("#tback_num").val(2);
    $("#tback_num").html(initOption(2,12));
    $("#dfore_true").html(initOption(0,1));
    $("#tfore_true").html(initOption(0,4));
    $("#dback_true").html(initOption(0,0));
    $("#tback_true").html(initOption(0,2));
    $("span[name='zhu']:visible").text(1);
    $("span[name='jine']:visible").text(2);

    initSingleBonus();
    var singlejj = $("table[name='tab']:visible tr");
    for(var m=1;m<singlejj.length;m++){
        $(singlejj[m]).children("td").eq(2).text("0注");
        $(singlejj[m]).children("td").eq(4).text("0元");
		if(isAp == 1){
			pieFlg[m-1]!='-1'?$(singlejj[m]).children("td").eq(5).text('0元'):$(singlejj[m]).children("td").eq(5).text('-')
		}
    }
    $("#zjje_T").text(0);//中奖金额
}
function calBonus(){
    var singlejj = $("table[name='tab']:visible tr");
    var total = 0;
    for(var i=1;i<singlejj.length;i++){
        var zhushu = Number($(singlejj[i]).children("td").eq(2).text().replace('注',''));
        var sjine = Number($(singlejj[i]).children("td").eq(3).text().replace('元','').replace(/\,/g,""));
        $(singlejj[i]).children("td").eq(4).text(formatData(zhushu*sjine)+'元');
        total += zhushu*sjine;
		if(isAp == 1){
			 if($("input[type='checkbox']:visible")[0].checked == true){
				i==1?$(singlejj[i]).children("td").eq(5).text(pieFlg[i-1]!='-1'?(formatData(zhushu*(Number(pieaward[i-1])+Number(pie[i-1])))+'元'):'-'):$(singlejj[i]).children("td").eq(5).text(pieFlg[i-1]!='-1'?(formatData(zhushu*Number(bonus[i-1])*$("#pro").val())+'元'):'-');
			}else{
				(pieFlg[i-1]!='-1'?$(singlejj[i]).children("td").eq(5).text('0元'):$(singlejj[i]).children("td").eq(5).text('-'));
			}
		}
    }
    $("#zjje_T").text(formatData(total));
}
function formatData(s){
    var n =0;
    s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
    var l = s.split(".")[0].split("").reverse(), r = s.split(".")[1];
    var t = "";
    for (i = 0; i < l.length; i++) {
        t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
    }
    return t.split("").reverse().join("") ;
}
function initSingleBonus(){
    var zj_btn = $("input[type='checkbox']:visible");
    var arr= $(zj_btn)[0].checked == true?bonuszj:bonus;
    var singlejj = $("table[name='tab']:visible tr");
    for(var m=1;m<singlejj.length;m++){
        $(singlejj[m]).children("td").eq(3).text(formatData(arr[m-1])+"元");
    }
}
function getBounsArr(arr,arrzj,send){
    bonus = [];
    bonuszj = [];
    pie = [];
    pieaward = [];
	pieFlg = [];
    for(var i=0;i<arr.length;i++){
        bonus.push(arr[i].money==""?"0":arr[i].money.replace(/\,/g,""));
        if(arrzj!=undefined && arrzj[i]){
            bonuszj.push(Number(arr[i].money==""?"0":arr[i].money.replace(/\,/g,""))+Number(arrzj[i].money==""?"0":arrzj[i].money.replace(/\,/g,"")));
        }
    }
	if(isAp==1){
		for(var j=0;j<send.length;j++){
    		send[j].level.indexOf("追加")!=-1?pieaward.push(send[j].sendPrize==""?"0":send[j].sendPrize.replace(/\,/g,"")):pie.push(send[j].sendPrize==""?"0":send[j].sendPrize.replace(/\,/g,""));
			send[j].level.indexOf("追加")!=-1?'':pieFlg.push(send[j].piece);
		}
	}
}
function judgeGrade(term){
    if(Number(term)<Number(jTerm)){//历史
        $("#tab6").show();
        $("#tab9").hide();
		$("#tabPie9").hide();
    }else{
        $("#tab6").hide();
		if(isAp==1){
			$("#tabPie9").show();
			$("#tab9").hide();
		}else{
			$("#tabPie9").hide();
			$("#tab9").show();
		}
    }
	isAp==1?$("#proDiv").show():$("#proDiv").hide();
}
function showD(term){
    $.ajax({
        url : '/api/lottery_kj_detail_new.jspx?_ltype=4&_term=' + term,
        dataType:'json',
        type:'POST',
        success : function(data) {
            if(data!=null){
                var codeNumber= data[0].codeNumber ;//开奖号码
                var codeStr="<b>"+codeNumber[0]+"</b> <b>"+codeNumber[1]+"</b> <b>"+codeNumber[2]+"</b> <b>"+codeNumber[3]+"</b> <b>"+codeNumber[4]+"</b> <b style='background: url(http://static.sporttery.cn/pres/proj/2019/201909_ball/images/lvse.png) repeat;color: #372048;'>"+codeNumber[5]+"</b> <b style='background:url(http://static.sporttery.cn/pres/proj/2019/201909_ball/images/lvse.png) repeat;color: #372048;'>"+codeNumber[6]+"</b>";
                $("#kj_code").html(codeStr);
				isAp = data[0].lottery.isAP;
				judgeGrade(term);
                getBounsArr(data[0].details,data[0].detailsAdd,data[0].sendPrizeList);//一等奖----六/九等奖
                //初始化单注奖金
                initSingleBonus();
                calBonus();
            }
        }
    });
}
function matchTerm(){
    $.ajax({
        url : '/api/get_typeBytermList.jspx?_ltype=4',
        dataType:'json',
        type:'POST',
        success : function(data) {
            var trem = data[0].tremList;//期号Arr
            for(var i=0;i<trem.length;i++){
                $("#selectMatch_term").append("<option value='"+trem[i]+"'>"+trem[i]+"</option>");
            }
            showD($("#selectMatch_term").val());//传入当前期数
        }
    });
}
