$(function(){

    $('.js-region ul .active a').each(function(){
        setClassAndRegionHiddenValue.apply(this);
    });

    $('.js-region ul a').click(function(){
        return setClassAndRegionHiddenValue.apply(this);
    });

    function setClassAndRegionHiddenValue() {
        var $parent = $(this).parents('.js-region');
        $parent.find('.value').html($(this).html());
        $parent.find('li').removeClass('active');
        $(this).parent().addClass('active');
        $(this).parent().click();
        $(this).parents('form').find('[id$="region"]').val($(this).data('region'));
        return false;
    }

});
