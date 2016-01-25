'use strict';
var ksa=require("ksana-simple-api");

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  TouchableHighlight,
  View, 
  Dimensions,
  LayoutAnimation,
  PanResponder,
  Animated,
  PropTypes, 
} = React;
var StaticRenderer = require('react-native/Libraries/Components/StaticRenderer');
var deviceWidth = Dimensions.get('window').width;

var Viewpager=React.createClass({
	propTypes:{
		pages:PropTypes.array.isRequired
	}
	,getDefaultProps:function() {
		return {transitionFriction:10,transitionTension:50}
	}
	,getInitialState:function(){
		return {currentPage:2,viewWidth:0,scrollValue:new Animated.Value(0)}
	}
	,componentWillMount:function(){
		this.childIndex = 0;
  		var panResponderMove=function(e, gestureState) {
	        var dx = gestureState.dx;
	        var offsetX = -dx / this.state.viewWidth + this.childIndex;
	        this.state.scrollValue.setValue(offsetX);
		}.bind(this);

		var release = function(e, gestureState) {
	      var relativeGestureDistance = gestureState.dx / deviceWidth,
	          //lastPageIndex = this.props.children.length - 1,
	          vx = gestureState.vx;

	      var step = 0;
	      if (relativeGestureDistance < -0.5 || (relativeGestureDistance < 0 && vx <= 0.5)) {
	        step = 1;
	      } else if (relativeGestureDistance > 0.5 || (relativeGestureDistance > 0 && vx >= 0.5)) {
	        step = -1;
	      }

	      this.props.hasTouch && this.props.hasTouch(false);

	      this.movePage(step, gestureState.vx);
	    }.bind(this);
		this._panResponder = PanResponder.create({
	      // Claim responder if it's a horizontal pan
	      onMoveShouldSetPanResponder: (e, gestureState) => {
	        if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
	          if (!this.state.fling) {
	            this.props.hasTouch && this.props.hasTouch(true);
	            return true;
	          }
	        }
	      },

	      // Touch is released, scroll to the one that you're closest to
	      onPanResponderRelease: release,
	      onPanResponderTerminate: release,

	      // Dragging, move the view with the touch
	      onPanResponderMove: panResponderMove
	    });
  	}	

  	,getPage:function(n, side){
  		return <StaticRenderer
  			key={'p'+n}
  			shouldUpdate={true}
  			render={this.props.renderPage.bind(null,this.props.pages[n],this.props.pages,side)}/>;
  	}
 	,movePage(step, vx) {
	    var pageCount = this.props.pages.length;
	    var pageNumber = this.state.currentPage + step;

	    pageNumber = Math.min(Math.max(0, pageNumber), pageCount - 1);

	    var moved = pageNumber !== this.state.currentPage;
	    var scrollStep = (moved ? step : 0) + this.childIndex;

	    this.state.fling = true;

	    var nextChildIdx = 0;
	    if (pageNumber > 0 || this.props.isLoop) {
	      nextChildIdx = 1;
	    }

	    var friction = (typeof this.props.transitionFriction === 'function') ?
	      this.props.transitionFriction(vx) : this.props.transitionFriction;
	    var tension = (typeof this.props.transitionTension === 'function') ?
	      this.props.transitionTension(vx) : this.props.transitionTension;

	    Animated.spring(this.state.scrollValue, {
	      toValue: scrollStep,
	      friction: friction,
	      tension: tension
	    }).start((event) => {
	      if (event.finished) {
	        this.state.fling = false;
	        this.childIndex = nextChildIdx;
	        this.state.scrollValue.setValue(nextChildIdx);
	        this.setState({
	          currentPage: pageNumber,
	        });
			moved && this.props.onChangePage && this.props.onChangePage(pageNumber);
	      }
	    });
	}
	,goToPage:function(pageNumber) {
	    var pageCount = this.props.pages.length;
	    if (pageNumber < 0 || pageNumber >= pageCount) {
	      console.error('Invalid page number: ', pageNumber);
	      return
	    }

	    var step = pageNumber - this.state.currentPage;
	    this.movePage(step);
	}	
	,onLayout:function(event){
		var viewWidth = event.nativeEvent.layout.width;
        if (!viewWidth || this.state.viewWidth === viewWidth) {
          return;
        }
        this.setState({
          currentPage: this.state.currentPage,
          viewWidth: viewWidth,
        });
	}
	,render:function(){
		var viewWidth = this.state.viewWidth;
		var bodyComponents=[];
		var pagesNum=0;
		var now=this.state.currentPage;
	    var sceneContainerStyle,translateX;
	    var viewWidth = this.state.viewWidth;
	    if (viewWidth>0&&this.props.pages.length>0){
	    	if (now>0) {
		    	bodyComponents.push(this.getPage(now-1,'left'));
		    	pagesNum++;
		    }
		    bodyComponents.push(this.getPage(now));
		    pagesNum++;
		    if (now<this.props.pages.length-1) {
		    	bodyComponents.push(this.getPage(now+1,'right'));
		    	pagesNum++;
		    }
		}

	    translateX = this.state.scrollValue.interpolate({
      		inputRange: [0, 1], outputRange: [0, -viewWidth]
    	});

	    sceneContainerStyle = {
	      width: viewWidth * pagesNum,
	      flex: 1,
	      flexDirection: 'row'
	    };
		return <View style={{flex:1}} onLayout={this.onLayout}> 
		<Animated.View style={[sceneContainerStyle, {transform: [{translateX}]}]}
          {...this._panResponder.panHandlers}>
          {bodyComponents}
        </Animated.View>
		</View>;
	}
});
var styles=StyleSheet.create({
	container:{
		flex:1,
		backgroundColor:'blue'
	}
});
module.exports=Viewpager;