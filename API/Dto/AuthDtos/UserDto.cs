namespace NursingScheduler.API.DTOs.Auth
{
    //what the api will return to the frontend after the login was successful
    public class UserDto
    {
        //username to display in navbar
        public required string Username { get; set; }

        //jwt token to authorize future request
        public required string Token { get; set; }
    }
}