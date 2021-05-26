import React from "react";
import {Route, Switch } from "react-router-dom";
import Homepage from "./containers/Homepage";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Search from "./containers/Search";

export default function Routes() {
  return (
    <Switch>
      /* homepage */
      <Route exact path="/">
        <Homepage />
      </Route>
      /* login page */
      <Route exact path="/login">
        <Login />
      </Route>
      /* search page */
      <Route exact path="/search">
        <Search />
      </Route>
      {/* Finally, catch all unmatched routes */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
