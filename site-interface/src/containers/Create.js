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

export default function Create() {
    const [isLoading, setIsLoading] = useState(false);
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        userID: "",
        owner: "",
        vaccineBrand: "",
        vaccineSite: "",
        vaccineDate: ""
    });

    // TODO
    function validateForm() {
        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsLoading(true);

        try {
            let createResponse = await fetch('http://localhost:8081/createPassport', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    authenticatedUser: sessionStorage.getItem("username"),
                    userID: fields.userID,
                    owner: fields.owner,
                    vaccineBrand: fields.vaccineBrand,
                    vaccineSite: fields.vaccineSite,
                    vaccineDate: fields.vaccineDate
                })
            });

            createResponse = await createResponse.text();
            console.log(createResponse);

        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
    }

  return (
    <div className="Create">
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
        <Form.Group size="lg" controlId="owner">
          <Form.Label>Full Name</Form.Label>
          <Form.Control
            type="owner"
            value={fields.owner}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="vaccineBrand">
          <Form.Label>Vaccine Brand</Form.Label>
          <Form.Control
            type="vaccineBrand"
            value={fields.vaccineBrand}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="vaccineSite">
          <Form.Label>Vaccine Site</Form.Label>
          <Form.Control
            type="vaccineSite"
            value={fields.vaccineSite}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="vaccineDate">
          <Form.Label>Vaccine Date</Form.Label>
          <Form.Control
            type="vaccineDate"
            value={fields.vaccineDate}
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
          Create Passport
        </LoaderButton>
      </Form>
    </div>
  );
}