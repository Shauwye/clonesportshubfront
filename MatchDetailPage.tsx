import { useParams, Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { matches } from '../data/mockData';
import { ArrowLeft, MapPin, Clock, Calendar, Users, TrendingUp, Target } from 'lucide-react';

export function MatchDetailPage() {
  const { id } = useParams();
  const match = matches.find((m) => m.id === id);

  if (!match) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Partido no encontrado</h2>
        <Link to="/agenda">
          <Button>Volver a la Agenda</Button>
        </Link>
      </div>
    );
  }

  // Mock data para estadísticas
  const stats = {
    homeTeam: {
      possession: 55,
      shots: 12,
      shotsOnTarget: 6,
      corners: 5,
      fouls: 8,
    },
    awayTeam: {
      possession: 45,
      shots: 9,
      shotsOnTarget: 4,
      corners: 3,
      fouls: 10,
    },
  };

  const predictions = [
    { user: 'Carlos R.', prediction: '2-1', points: 0 },
    { user: 'María G.', prediction: '1-1', points: 0 },
    { user: 'Pedro L.', prediction: '3-2', points: 0 },
    { user: 'Ana M.', prediction: '2-0', points: 0 },
  ];

  const recentForm = [
    { team: match.homeTeam, results: ['W', 'W', 'D', 'W', 'L'] },
    { team: match.awayTeam, results: ['W', 'L', 'W', 'W', 'D'] },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Back Button */}
      <Link to="/agenda">
        <Button variant="ghost">
          <ArrowLeft className="mr-2 size-4" />
          Volver a la Agenda
        </Button>
      </Link>

      {/* Match Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary">Grupo {match.group}</Badge>
            <Badge variant="outline">{match.status}</Badge>
          </div>

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center flex-1 max-w-xs">
              <div className="text-7xl mb-4">{match.homeFlag}</div>
              <h2 className="text-2xl font-bold">{match.homeTeam}</h2>
              {match.homeScore !== null && (
                <div className="text-5xl font-bold text-blue-600 mt-4">
                  {match.homeScore}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-gray-400 mb-2">VS</div>
              {match.homeScore === null && (
                <div className="text-sm text-gray-600">{match.time}</div>
              )}
            </div>

            <div className="text-center flex-1 max-w-xs">
              <div className="text-7xl mb-4">{match.awayFlag}</div>
              <h2 className="text-2xl font-bold">{match.awayTeam}</h2>
              {match.awayScore !== null && (
                <div className="text-5xl font-bold text-blue-600 mt-4">
                  {match.awayScore}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="size-4" />
              <span>
                {new Date(match.date).toLocaleDateString('es', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4" />
              <span>{match.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <span>
                {match.stadium}, {match.city}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/entradas" className="block">
          <Button className="w-full">Comprar Entradas</Button>
        </Link>
        <Link to="/quinielas" className="block">
          <Button variant="outline" className="w-full">
            Hacer Pronóstico
          </Button>
        </Link>
        <Button variant="outline" className="w-full">
          Agregar a Favoritos
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          <TabsTrigger value="predictions">Pronósticos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Partido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Estadio</h4>
                  <p className="text-gray-600">{match.stadium}</p>
                  <p className="text-sm text-gray-500">{match.city}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fase</h4>
                  <p className="text-gray-600">Fase de Grupos - Grupo {match.group}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fecha y Hora</h4>
                  <p className="text-gray-600">
                    {new Date(match.date).toLocaleDateString('es')}
                  </p>
                  <p className="text-sm text-gray-500">{match.time}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Estado</h4>
                  <Badge>{match.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forma Reciente</CardTitle>
              <CardDescription>Últimos 5 partidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentForm.map((form, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-semibold">{form.team}</span>
                  <div className="flex gap-1">
                    {form.results.map((result, i) => (
                      <div
                        key={i}
                        className={`size-8 rounded flex items-center justify-center font-semibold ${
                          result === 'W'
                            ? 'bg-green-100 text-green-700'
                            : result === 'L'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Partido</CardTitle>
              <CardDescription>Comparación entre equipos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Possession */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{match.homeTeam}</span>
                  <span className="text-sm text-gray-600">Posesión</span>
                  <span className="font-semibold">{match.awayTeam}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-bold">{stats.homeTeam.possession}%</span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${stats.homeTeam.possession}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold">{stats.awayTeam.possession}%</span>
                </div>
              </div>

              {/* Shots */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.homeTeam.shots}
                </span>
                <span className="text-sm text-gray-600">Tiros</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.awayTeam.shots}
                </span>
              </div>

              {/* Shots on Target */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.homeTeam.shotsOnTarget}
                </span>
                <span className="text-sm text-gray-600">Tiros al arco</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.awayTeam.shotsOnTarget}
                </span>
              </div>

              {/* Corners */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.homeTeam.corners}
                </span>
                <span className="text-sm text-gray-600">Córners</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.awayTeam.corners}
                </span>
              </div>

              {/* Fouls */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {stats.homeTeam.fouls}
                </span>
                <span className="text-sm text-gray-600">Faltas</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.awayTeam.fouls}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5" />
                Pronósticos de la Comunidad
              </CardTitle>
              <CardDescription>
                Lo que otros usuarios predicen para este partido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {predictions.map((pred, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {pred.user.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{pred.user}</div>
                      <div className="text-xs text-gray-600">Pronóstico</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {pred.prediction}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold">Haz tu pronóstico</h4>
                  <p className="text-sm text-gray-600">
                    Gana puntos prediciendo el resultado correcto
                  </p>
                </div>
                <Link to="/quinielas" className="ml-auto">
                  <Button>Pronosticar</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
