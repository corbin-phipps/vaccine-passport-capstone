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
                    authenticatedUser: sessionStorage.getItem("username"),
                    userID: fields.userID,
                    vaccineSite2: fields.vaccineSite2,
                    vaccineDate2: fields.vaccineDate2
                })
            });

            updateResponse = await updateResponse.text();
            console.log(updateResponse);

            let items = updateResponse.split(",");
            let id = items[0].split(":")[1];
            id = id.replace(/['"]+/g, '');

            let owner = items[1].split(":")[1];
            owner = owner.replace(/['"]+/g, '');

            let vaccineBrand = items[2].split(":")[1];
            vaccineBrand = vaccineBrand.replace(/['"]+/g, '');

            let vaccinationSite = items[3].split(":")[1];
            vaccinationSite = vaccinationSite.replace(/['"]+/g, '');

            let vaccinationSite2 = items[4].split(":")[1];
            vaccinationSite2 = vaccinationSite2.replace(/['"]+/g, '');

            let dateOfFirstDose = items[5].split(":")[1];
            dateOfFirstDose = dateOfFirstDose.replace(/['"]+/g, '');

            let dateOfSecondDose = items[6].split(":")[1];
            dateOfSecondDose = dateOfSecondDose.replace(/['"}]+/g, '');

            let res = "User ID: " + id;
            res += "\n" + "Owner Name: " + owner;
            res += "\n" + "Vaccine Brand: " + vaccineBrand;
            res += "\n" + "Vaccination Site: " + vaccinationSite;
            if (vaccinationSite2 !== "") {
              res += "\n" + "Second Vaccination Site: " + vaccinationSite2;
            }
            
            res += "\n" + "Date of First Dose: " + dateOfFirstDose;

            if (dateOfSecondDose !== "") {
              res += "\n" + "Date of Second Dose: " + dateOfSecondDose;
            }
            
            alert(res);

        } catch (e) {
            onError(e);
            setIsLoading(false);
        }
        window.location.reload(false);
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
          isLoading={false}
          disabled={!validateForm()}
        >
          Update Passport
        </LoaderButton>
      </Form>
    </div>
  );
}