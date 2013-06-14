/*
*
* jquery.myAjaxForm
*
* */
(function($){

    var fieldAlert=function(field){
        var field=this;
        var invoke=0;
        var interval=setInterval(function(){
            invoke++;
            if(invoke==7 || field.length==0){
                clearInterval(interval);
            }else{
                field.parent().toggleClass("alert");
            }
        },300);
    };

    var showMsg=function(msg){
        var field=this,msgUI=this.nextAll(".msg");
        if(msgUI.length==0){
            msgUI=$("<span class='msg'></span>").appendTo(field.parent());
        }
        if(msg.length>0){
            msgUI.removeClass("valid-msg").addClass("err-msg").html(msg.join(","));
            field.parent().addClass("failed");
            fieldAlert.call(field.filter(":visible").length>0?field:field.parent());
        }else{
            msgUI.removeClass("err-msg").addClass("valid-msg").html("");
            field.parent().removeClass("failed");
        }
    };
    var validate=function(opts){
        var result=[];
        opts.fields.each(function(){
            result.push(validateField.call(this,opts));
        });
        var msg=[];
        for (var i = 0; i < result.length; i++) {
            var obj = result[i];
            if(obj.msg.length>0){
                msg.push(obj.field.attr("name")+obj.msg);
            }
        }
        return msg.length==0?true:false;
    };
    var validateField=function(opts){
        var field=$(this);
        var value=getFieldValue.call(field);
        var errMsgArr=field.attr("err-msg")?field.attr("err-msg").split("|"):null;
        var vs=field.attr(opts.validatorAttrName).split(" ");
        var msg=[];
        for (var i = 0; i < vs.length; i++) {
            var obj = vs[i];
            var vr=obj.replace("]","").replace("[",",").split(",");
            var vrName=vr[0];
            vr[0]=value;
            if(validators[vrName] && !validators[vrName].apply(field,vr)){
                var str= errMsgArr&&errMsgArr.length>i&&errMsgArr[i]!=""?errMsgArr[i]:errorMessage[vrName];
                if(str){
                    for (var j = 0; j < vr.length; j++) {
                        var obj1 = vr[j];
                        str=str.replace(new RegExp("\\{"+j+"\\}","ig"),vr[j]);
                    }
                    msg.push(str);
                }
            }
        }
        showMsg.call(field,msg);
        return {
            field:field,
            msg:msg
        };
    };
    var initEvent=function(opts){
        var form=this;
        form.submit(function(){
            setTimeout(function(){
                opts.onBeforeValidate && opts.onBeforeValidate.call(form);
                if(validate.call(form,opts)){
                    //
                    $.post(opts.url || getApi(opts.api) || form.attr("action"),form.serialize(),function(data){
                        opts.success && opts.success.call(form,data);
                    },"json");
                }else{
                    //error
                }
            },0);
            return false;
        });
        opts.fields=form.find("["+opts.validatorAttrName+"]").each(function(){
            var field=$(this);
            field.focus(function(){

            });
            field.blur(function(){
                var value=getFieldValue.call(field),original=field.attr("original-val");
                if(original!=value){
                    field.attr("original-val",value);
                    validateField.call(this,opts);
                }
            });
        });
    };
    var getFieldType=function(field){
        var tagName=field.attr("tagName")?field.attr("tagName").toLocaleLowerCase():field[0].tagName.toLocaleLowerCase();
        if(tagName=="input"){
            var type=field.attr("type").toLocaleLowerCase();
            return type;
        }
        return tagName;
    };
    var getFieldValue=function(){
        var field=this;
        var value=fieldValue[getFieldType(field)]?fieldValue[getFieldType(field)].call(field):field.val();
        return value;
    };
    var fieldValue={
        checkbox:function(){
            var form=this.closest("form");
            var checkedFields=form.find(":checkbox[name='"+this.attr("name")+"']:checked");
            return checkedFields.length==0?"":checkedFields.val();
        }
    };
    var validators={
        required:function(val){
            return $.trim(val)==""?false:true;
        },
        numeric: function(val) {
            return val==""||/^\d+$/.test(val);
        },
        length:function(val,min,max){
            var length=val.length;
            var valid=!(length<min*1 || (max && length>max*1));
            return valid;
        },
        min: function(val,min) {
            return val>min*1;
        },
        max: function(val,max) {
            return val<max*1;
        },
        email:function(val){
            var valid=(/^(([\-\w]+)\.?)+@(([\-\w]+)\.?)+\.[a-zA-Z]{2,4}$/).test(val);
            return val==""||valid;
        },
        phone:function(val){
            var valid=(/^13[0-9]{1}[0-9]{8}$|15[012356789]{1}[0-9]{8}$|18[012356789]{1}[0-9]{8}$|14[57]{1}[0-9]$/).test(val);
            return val==""||valid;
        },
        equal:function(val,id){
            var valid=val==document.getElementById(id).value;
            return valid;
        },
        equal:function(val,id){
            var valid=val==document.getElementById(id).value;
            return valid;
        },
        regexp:function(val,pattern,options){
            var regexp=new RegExp(pattern);
            var valid=regexp.test(val);
            return valid;
        }
    };
    var errorMessage={
        required:"不能为空",
        length:"长度必须为{1}到{2}",
        email:"邮箱格式不正确",
        phone:"手机号码不正确",
        numeric:"必须是数字",
        min:"必须是小于{1}的数字",
        max:"必须是大于{1}数字",
        equal:"数据不正确",
        regexp:"数据不正确"
    };

    var getApi=function(api){
        var apiArr=api.split(".");
        var _api=$.myAjaxForm.api;
        for (var i = 0; i < apiArr.length; i++) {
            if(!_api)break;
            var obj = apiArr[i];
            _api=_api[obj];
        }
        if(!_api){
            _api=api.replace(/\./g,"/");
        }
        return $.myAjaxForm.global.apiPath+_api;
    };

    $.myAjaxForm=function(){
        return {};
    }();
    $.myAjaxForm.global={
        fieldValue:fieldValue,
        apiPath:"",
        type:"post",
        validatorAttrName:"validator"
    };
    $.myAjaxForm.api={};
    var methods={
        init:function(params){
            return this.each(function(){
                var opts= $.extend({}, $.myAjaxForm.global,params);
                initEvent.call($(this).addClass("my-ajax-form"),opts);
            });
        }
    };
    $.fn.myAjaxForm = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.tooltip');
        }
    };
})(jQuery);