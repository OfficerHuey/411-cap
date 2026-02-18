using NursingScheduler.API.Entities;
//jwt token that the frontend can use to verify identity
//safety measure since app contains sensitive information
namespace NursingScheduler.API.Interfaces

{
    public interface ITokenService
    {
        //give me a user, i will give you a jwt string
        string CreateToken(AppUser user);
    }
}