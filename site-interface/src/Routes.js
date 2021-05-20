import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";

export default function Routes() {
  return (
    <Switch>
      /* homepage */
      <Route exact path="/">
        <Home />
      </Route>
      /* login page */
      <Route exact path="/login">
        <Login />
      </Route>
      /* sign up page */
      <Route exact path="/signup">
        <Signup />
      </Route>
      {/* Finally, catch all unmatched routes */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}