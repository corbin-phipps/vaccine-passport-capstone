//import React from "react";
//import "./Homepage.css";
//
//export default function Home() {
//  return (
//    <div className="Home">
//      <div className="lander">
//        <h1>Vaccine Passport Portal</h1>
//        <p className="text-muted"> Login to view your own passport or search to find others </p>
//      </div>
//      <div id="button">
//        <a href="Login.js">Log In</a>
//        <a href="Search.js">Search</a>
//      </div>
//    </div>
//  );
//}

//import React from "react";
//import "./Homepage.css";
//import MyComponent from "./containers/MyComponent";
//import { BrowserRouter, Route } from 'react-router-dom'
//
//class MyRouter extends React.Component {
//  render () {
//    return (
//      <BrowserRouter>
//        <Route
//          path='/'
//          render={ props => <MyComponent {...props} />}
//        />
//      </BrowserRouter>
//    )
//  }
//}
//
//class Homepage extends React.Component {
//    redirectToTarget = () => {
//        this.props.history.push(`/search`)
//    }
//  render () {
//    return (
//       <div>
//        {this.renderRedirect()}
//        <button onClick={this.redirectToTarget}>Login</button>
//        <button onClick={this.redirectToTarget}>Search</button>
//       </div>
//    )
//  }
//}


////export default Homepage;
//
//          <form>
//            <Button variant="btn btn-success" onClick={() => history.push('/search')}>Search</Button>
//            <Button variant="btn btn-success" onClick={() => history.push('/login')}>Login</Button>
//          </form>

import "./Homepage.css";
import { BrowserRouter, Route } from 'react-router-dom'
import React, { Component } from "react";
import { Button } from 'react-bootstrap';
import history from './../history';

export default class Home extends Component {
  render() {
    return (
      <div className="Home">
        <div className="lander">
          <h1>Vaccine Passport Portal</h1>
          <p className="text-muted"> Login to view your own passport or search to find others </p>
        </div>
      </div>
    );
  }
}
//export default Homepage;
