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

export default function Read() {
    const [isLoading, setIsLoading] = useState(false);
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        targetUser: ""
    });

    // TODO
    function validateForm() {
        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setIsLoading(true);

        try {
            let readResponse = await fetch('http://localhost:8081/readPassport', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    authenticatedUser: sessionStorage.getItem("username"),
                    targetUser: fields.targetUser
                })
            });

            readResponse = await readResponse.text();
            console.log(readResponse);

        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

  return (
    <div className="Read">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="targetUser">
          <Form.Label>User ID</Form.Label>
          <Form.Control
            autoFocus
            type="targetUser"
            value={fields.targetUser}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          isLoading={false}
          disabled={!validateForm()}
        >
          Read Passport
        </LoaderButton>
      </Form>
    </div>
  );
}