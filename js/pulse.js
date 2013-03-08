/* js that is required by the pulse */

var Pulse_CPT = {
    onReady: function() {
        Pulse_CPT.listen();
        
        //these are delegated to .pulse-list to attach to dynamic elements too
        jQuery('.pulse-list').on( 'click', '.pulse', Pulse_CPT.expand );
        jQuery('.pulse-list').on( 'click', '.expand-action', Pulse_CPT.expand );
        
        //Prevent collapse if any of these within a pulse are clicked
        jQuery('.pulse-list').on( 'click', '.pulse-replies .pulse, .pulse a, .pulse .postbox', function(e) { e.stopPropagation(); } );
        
        //Reply
        jQuery('.pulse-list').on( 'click', '.reply-action', function(e) {
            // We want to know the caller
            Pulse_CPT.reply.apply(this);
            e.stopPropagation(); //stop so we dont collapse parent pulse
        } );
    },
    
    listen: function() {
        if ( typeof CTLT_Stream != 'undefined' ) { //check for stream activity
            CTLT_Stream.on( 'server-push', function (data) { //catch server push
                if ( data.type == 'pulse' ) { //we are interested
                    var new_pulse_data = jQuery.parseJSON(data.data); //extract pulse data from the event
                    if ( new_pulse_data.parent == 0 ) { //no parent -> show on front page
                        var new_pulse = Pulse_CPT_Form.single_pulse_template(new_pulse_data);
                        jQuery(new_pulse).prependTo('.pulse-list').hide().slideDown('slow');
                    } else { //check to see if the parent of the pulse is visible to current user
                        var all_visible_parents = jQuery('.pulse.expand'); //all visible parents
                        jQuery.each( all_visible_parents, function( i, val ) { //loop through and try to match the ids
                            if ( jQuery(val).data('pulse-id') == new_pulse_data.parent ) { //if so, put it to its replies section
                                var new_pulse = Pulse_CPT_Form.single_pulse_template(new_pulse_data);
                                jQuery(new_pulse).prependTo(jQuery(val).find('.pulse-expand-content .pulse-replies')).hide().slideDown('slow');
                            }
                        } );
                    }
                }
            });
        }
    },
    
    expand: function() {
        var el = jQuery(this).closest('.pulse');
        el.data('pulse');
        
        el.toggleClass('expand');
        el.find('.pulse-expand-content').toggle(); //toggle visibility of expand-content
        
        if ( el.hasClass('expand') ) {
            el.find('.expand-action').text( 'Collapse' );
            Pulse_CPT.expandPulse(el); //ajax call to fetch replies
        } else {
            el.find('.expand-action').text( 'Expand' );
            Pulse_CPT_Form.reply(); //reset form location if collapsed
        }
    },
    
    expandPulse: function(element) {
        var args = {};
        args['pulse_id'] = element.data('pulse-id');
        
        //show loading spinner
        element.find( '.pulse-form-progress' ).removeClass( 'hide' );
        jQuery.ajax( {
            url: Pulse_CPT_Form_global.ajaxUrl,
            data: {
                action: 'pulse_cpt_replies',
                data: args,
            },
            type: 'post',
            success: function(data) {
                //hide spinner again and show content
                element.find( '.pulse-form-progress' ).addClass( 'hide' );
                jQuery(element).find('.pulse-replies').html(data);
            }
        } );
    },
    
    reply: function() {
        var parent_pulse = jQuery(this).closest('.pulse');
        if ( ! parent_pulse.hasClass('expand') ) { //expand first if not expanded
            Pulse_CPT.expand.apply(this);
        }
        //reply form, pass caller element along with parent pulse ID
        Pulse_CPT_Form.reply.apply( this, [ parent_pulse ] );
    }	
}

jQuery('document').ready(Pulse_CPT.onReady);