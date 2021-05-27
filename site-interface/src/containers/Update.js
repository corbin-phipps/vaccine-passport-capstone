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

export default function Update() {
    const [isLoading, setIsLoading] = useState(false);
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        userID: "",
        vaccineSite2: "",
        vaccineDate2: ""
    });

    // TODO
    function validateForm() {
        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsLoading(true);

        try {
            let updateResponse = await fetch('http://localhost:8081/updatePassport', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    authenticatedUser: "vaccineAdministrator1",
                    userID: fields.userID,
                    vaccineSite2: fields.vaccineSite2,
                    vaccineDate2: fields.vaccineDate2
                })
            });

            updateResponse = await updateResponse.text();
            console.log(updateResponse);

        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

  return (
    <div className="Update">
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="userID">
          <Form.Label>User ID</Form.Label>
          <Form.Control
            autoFocus
            type="userID"
            value={fields.userID}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="vaccineSite2">
          <Form.Label>Second Vaccine Site</Form.Label>
          <Form.Control
            autoFocus
            type="vaccineSite2"
            value={fields.vaccineSite2}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="vaccineDate2">
          <Form.Label>Second Vaccine Date</Form.Label>
          <Form.Control
            autoFocus
            type="vaccineDate2"
            value={fields.vaccineDate2}
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
          Update Passport
        </LoaderButton>
      </Form>
    </div>
  );
}