import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import { useHistory } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../libs/contextLib";
import { onError } from "../libs/errorLib";
import "./Login.css";

export default function Login() {
  const history = useHistory();
  const { userHasAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function validateForm() {
    return username.length > 0 && password.length > 0;
  }

  useEffect(() => {
    const loggedInUser = sessionStorage.getItem("username");
    if (loggedInUser) {
      const foundUser = loggedInUser;
      if (foundUser !== "generalUser") {
        setUsername(foundUser)
      }
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const loginResponse = await fetch('http://localhost:8081/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({authenticatedUser: username})
      });

      let loginTypeResponse = await loginResponse.text();
      console.log(loginTypeResponse);
      
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("password", password);
      sessionStorage.setItem("userType", loginTypeResponse);
  
      if (loginTypeResponse === 'client') {
        userHasAuthenticated(true);
        history.push("/");
        console.log('client');
      } else if (loginTypeResponse === 'admin') {
        userHasAuthenticated(true);
        history.push("/");  
        console.log('admin');
      } else {
        // clear form
      }

    } catch (e) {
      onError(e);
      setIsLoading(false);
    }
  }
  
  /*
  if (username) {
    return <div>{username} is logged in</div>;
  }
  */
  
  return (
    <div className="Login">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            autoFocus
            type="username"
            value={username}
            onChange={({ target }) => setUsername(target.value)}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
          />
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          isLoading={false}
          disabled={!validateForm()}
        >
          Login
        </LoaderButton>
      </Form>
    </div>
  );

}