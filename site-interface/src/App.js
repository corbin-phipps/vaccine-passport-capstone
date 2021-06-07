import React, { useState, useEffect } from "react";
import Navbar from "react-bootstrap/Navbar";
import "./App.css";
import Routes from "./Routes";
import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";
import { AppContext } from "./libs/contextLib";
import { useHistory } from "react-router-dom";
import { onError } from "./libs/errorLib";

function App() {
    // browser's history api
    const history = useHistory();
    // setting to true -> start checking current authentication state of user
    const [isAuthenticating, setIsAuthenticating] = useState(true);

    // updating the application state by setting that the user is logged in
    // set false, because user not logged in yet. calling userHasAuthenticated updates it
    const [isAuthenticated, userHasAuthenticated] = useState(false);

    /* The useEffect hook takes a function and an array of variables.
    The function will be called every time the component is rendered.
    And the array of variables tell React to only re-run our function
    if the passed in array of variables have changed.
    This allows us to control when our function gets run.

    If we don’t pass in an array of variables, our hook gets executed everytime our component is rendered.
    If we pass in some variables, on every render React will first check if those variables have changed,
    before running our function.
    If we pass in an empty list of variables, then it’ll only run our function on the FIRST render.
    In our case, we only want to check the user’s authentication state when our app first loads.
    So we’ll use the third option; just pass in an empty list of variables — [].*/
    useEffect(() => {
      onLoad();
    }, []);

    // Checks if logged-in by checking session storage for a username. If not logged-in, set session storage user to 'generalUser'
    async function onLoad() {
      try {
        const loggedInUser = sessionStorage.getItem("username");
        if (loggedInUser) {
          userHasAuthenticated(true);
        } else {
          userHasAuthenticated(false);
          sessionStorage.setItem("username", "generalUser");
          sessionStorage.setItem("userType", "client");
        }
      }
      catch(e) {
        if (e !== 'No current user') {
          onError(e);
        }
      }

      setIsAuthenticating(false);
    }

    // Redirect to login page when user logs out
    async function handleLogout() {
      userHasAuthenticated(false);
      history.push("/login");
    }

  const loggedInUserType = sessionStorage.getItem("userType");

  // Render different JSX code depending on the identity type of the user logged-in
  if (loggedInUserType === 'client') {
    return (
    // dont render until !isAuthenticating because loading user session is asynch.
    // this ensures app doesnt change states in the middle of init load
      !isAuthenticating && (
        <div className="App container py-3">
          <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
            <LinkContainer to="/">
              <Navbar.Brand className="font-weight-bold text-muted">
              </Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav activeKey={window.location.pathname}>
                {isAuthenticated ? (
                    <>
                      <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                      <LinkContainer to="/">
                        <Nav.Link>Home</Nav.Link>
                      </LinkContainer>
                      <LinkContainer to="/readPassport">
                        <Nav.Link>Search</Nav.Link>
                      </LinkContainer>
                    </>
                ) : (
                  <>
                    <LinkContainer to="/login">
                      <Nav.Link>Login</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to="/readPassport">
                      <Nav.Link>Search</Nav.Link>
                    </LinkContainer>
                  </>
                )}

              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
            <Routes />
          </AppContext.Provider>
        </div>
      )
    );
  } else if (loggedInUserType === 'admin') {
    return (
    // dont render until !isAuthenticating because loading user session is asynch.
    // this ensures app doesnt change states in the middle of init load
      !isAuthenticating && (
        <div className="App container py-3">
          <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
            <LinkContainer to="/">
              <Navbar.Brand className="font-weight-bold text-muted">
              </Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav activeKey={window.location.pathname}>
                {isAuthenticated ? (
                    <>
                      <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                      <LinkContainer to="/">
                        <Nav.Link>Home</Nav.Link>
                      </LinkContainer>
                      <LinkContainer to="/readPassport">
                        <Nav.Link>Search</Nav.Link>
                      </LinkContainer>
                        <LinkContainer to="/createPassport">
                      <Nav.Link>Create Passport</Nav.Link>
                        </LinkContainer>
                      <LinkContainer to="/updatePassport">
                        <Nav.Link>Update Passport</Nav.Link>
                      </LinkContainer>
                    </>
                ) : (
                  <>
                    <LinkContainer to="/login">
                      <Nav.Link>Login</Nav.Link>
                    </LinkContainer>
                  </>
                )}

              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
            <Routes />
          </AppContext.Provider>
        </div>
      )
    );
  }
  return (
    // dont render until !isAuthenticating because loading user session is asynch.
    // this ensures app doesnt change states in the middle of init load
      !isAuthenticating && (
        <div className="App container py-3">
          <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
            <LinkContainer to="/">
              <Navbar.Brand className="font-weight-bold text-muted">
              </Navbar.Brand>
            </LinkContainer>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav activeKey={window.location.pathname}>        
                  <>
                    <LinkContainer to="/login">
                      <Nav.Link>Login</Nav.Link>
                    </LinkContainer>
                    <LinkContainer to="/readPassport">
                      <Nav.Link>Search</Nav.Link>
                    </LinkContainer>
                  </>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
            <Routes />
          </AppContext.Provider>
        </div>
      )
    );
}

export default App;
