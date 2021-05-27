import React, { useState } from "react";
//import { Auth } from "aws-amplify";
import Form from "react-bootstrap/Form";
import { useHistory } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../libs/contextLib";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import "./Login.css";
import { createBrowserHistory } from "history";
import Cookies from "js-cookie";
import Session from "../sessions";

export default function Login() {
  const history = useHistory();
  const { userHasAuthenticated } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [fields, handleFieldChange] = useFormFields({
    username: "",
    password: ""
  });
  let loginType = "noUserLogin";

  function validateForm() {
    return fields.username.length > 0 && fields.password.length > 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsLoading(true);

    try {
      //const loginResponse = "";
//      await Auth.signIn(fields.username, fields.password);
      //TODO
      const loginResponse = await fetch('http://localhost:8081/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({authenticatedUser: fields.username})
      });

      loginType = await loginResponse.text();
      console.log(loginType);
  
      if (loginType === 'client') {
        Session.setSessionCookie({ fields });
        userHasAuthenticated(true);
        history.push("/");
        console.log('client');
      } else if (loginType === 'admin') {
        Session.setSessionCookie({ fields });
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

  return (
    <div className="Login">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            autoFocus
            type="username"
            value={fields.username}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={fields.password}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Login
        </LoaderButton>
      </Form>
    </div>
  );
}