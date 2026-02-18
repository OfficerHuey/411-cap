using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using NursingScheduler.API.Entities;
using NursingScheduler.API.Interfaces;

namespace NursingScheduler.API.Services
{
    public class TokenService : ITokenService
    {
        //we need the secret key from appsettings.json
        private readonly SymmetricSecurityKey _key;

        public TokenService(IConfiguration config)
        {
            //getting the key and encoding it into bytes
            _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"]!));
        }

        public string CreateToken(AppUser user)
        {
            //(what info is inside the token)
            //we store the username so the server knows who is calling
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.NameId, user.UserName)
            };

            //create credentials (signing the token)
            //using hmacsha512 encryption algorithm
            var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

            //describe the token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7), //token valid for 1 week
                SigningCredentials = creds
            };

            //build and return the token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}