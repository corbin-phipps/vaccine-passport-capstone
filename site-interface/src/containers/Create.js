import React from "react";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import "./Login.css";

export default function Create() {
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        userID: "",
        owner: "",
        vaccineBrand: "",
        vaccineSite: "",
        vaccineDate: ""
    });

    // Sends request to the createPassport route in the server, with the create passport form fields as the request body.
    // Parses the server response and displays the returned passport fields to the screen (currently as an alert)
    async function handleSubmit(event) {
        event.preventDefault();

        try {
          let createResponse = await fetch('/createPassport', {
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

            // Parse the server response
            if (createResponse.startsWith("Identity") || createResponse.startsWith("{\"message") ) {
              alert("Error: Identity for the given user already exists");
            } else {
              let items = createResponse.split(",");
              items = JSON.parse(items);
              console.log('items: ', items);

              let id = items["ID"];
              let owner = items["Owner"];
              let vaccineBrand = items["VaccineBrand"];
              let vaccinationSite = items["VaccinationSite"];
              let dateOfFirstDose = items["DateOfFirstDose"];
              
              // Create the alert for displaying the parsed passport fields
              let res = "User ID: " + id;    
              res += "\n" + "Owner Name: " + owner;
              res += "\n" + "Vaccine Brand: " + vaccineBrand;
              res += "\n" + "Vaccination Site: " + vaccinationSite;        
              res += "\n" + "Date of First Dose: " + dateOfFirstDose;
              alert(res);
            }
        } catch (e) {
            onError(e);
        }
        window.location.reload(false);
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
        >
          Create Passport
        </LoaderButton>
      </Form>
    </div>
  );
}