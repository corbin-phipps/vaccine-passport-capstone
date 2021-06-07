import React from "react";
import Form from "react-bootstrap/Form";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../libs/hooksLib";
import { onError } from "../libs/errorLib";
import "./Login.css";

export default function Update() {
    const [fields, handleFieldChange] = useFormFields({
        authenticatedUser: "",
        userID: "",
        vaccineSite2: "",
        vaccineDate2: ""
    });

    // Sends request to the updatePassport route in the server, with the logged-in user and second dose fields as the request body.
    // Parses the server response and displays the full updated passport to the screen (currently as an alert)
    async function handleSubmit(event) {
        event.preventDefault();

        try {
            let updateResponse = await fetch('/updatePassport', {
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
            items = JSON.parse(items);
            console.log('items: ', items);

            let id = items["ID"];
            let owner = items["Owner"];
            let vaccineBrand = items["VaccineBrand"];
            let vaccinationSite = items["VaccinationSite"];
            let vaccinationSite2 = items["VaccinationSite2"];
            let dateOfFirstDose = items["DateOfFirstDose"];
            let dateOfSecondDose = items["DateOfSecondDose"];

            // Create the alert for displaying the updated passport to the screen
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
        >
          Update Passport
        </LoaderButton>
      </Form>
    </div>
  );
}